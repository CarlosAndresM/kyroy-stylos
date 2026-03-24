import { NextRequest, NextResponse } from 'next/server';
import archiver from 'archiver';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { getNominaByRange } from '@/features/nomina/services';
import { VolantePDF } from '@/components/nomina/volante-pdf';
import path from 'path';
import { PassThrough, Readable } from 'node:stream';
import fs from 'fs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const startStr = searchParams.get('startDate');
    const endStr = searchParams.get('endDate');
    const type = searchParams.get('type') || 'TECNICO';

    console.log(`[ZIP-API] Iniciando generación para ${type} desde ${startStr} hasta ${endStr}`);

    if (!startStr || !endStr) {
        return NextResponse.json({ error: 'Rango de fechas requerido' }, { status: 400 });
    }

    // Usar mediodía para evitar saltos de zona horaria
    const start = new Date(`${startStr}T12:00:00`);
    const end = new Date(`${endStr}T12:00:00`);

    try {
        const res = await getNominaByRange(start, end, type);
        if (!res.success || !res.data) {
            console.warn(`[ZIP-API] Nómina no encontrada para el rango especificado.`);
            return NextResponse.json({ error: res.error || 'Nómina no encontrada' }, { status: 404 });
        }

        const { details, NM_FECHA_INICIO, NM_FECHA_FIN } = res.data;

        if (!details || details.length === 0) {
            console.warn(`[ZIP-API] La nómina existe pero no tiene detalles.`);
            return NextResponse.json({ error: 'No hay detalles de pago para este periodo' }, { status: 404 });
        }

        const rangeLabel = `${format(new Date(NM_FECHA_INICIO), 'dd MMM', { locale: es })} - ${format(new Date(NM_FECHA_FIN), 'dd MMM yyyy', { locale: es })}`;

        const passthrough = new PassThrough();
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('error', (err) => {
            console.error('[ZIP-API] Archiver error:', err);
            passthrough.destroy(err);
        });

        archive.pipe(passthrough);

        // Logo handling
        const logoPath = path.join(process.cwd(), 'public', 'LOGO.png');
        let logoData: Buffer | string | undefined;

        try {
            if (fs.existsSync(logoPath)) {
                logoData = fs.readFileSync(logoPath);
                console.log(`[ZIP-API] Logo cargado satisfactoriamente (${logoData.length} bytes).`);
            } else {
                console.warn(`[ZIP-API] Logo no encontrado en ${logoPath}, se usará placeholder o nada.`);
            }
        } catch (err) {
            console.error('[ZIP-API] Error leyendo logo:', err);
        }

        // Proceso de generación asíncrono
        (async () => {
            try {
                console.log(`[ZIP-API] Generando ${details.length} PDFs...`);
                for (let i = 0; i < details.length; i++) {
                    const detail = details[i];
                    const pdfData = {
                        ...detail,
                        periodoRange: rangeLabel
                    };

                    try {
                        // Generar PDF secuencialmente para evitar picos de memoria
                        const pdfBuffer = await renderToBuffer(
                            React.createElement(VolantePDF, { data: pdfData, logoUrl: logoData }) as any
                        );

                        const branchFolder = detail.SC_NOMBRE ? detail.SC_NOMBRE.trim().toUpperCase() : 'GLOBAL';
                        const vpId = detail.ND_IDDETALLE_PK?.toString().padStart(5, '0') || `${i + 1}`.padStart(5, '0');
                        const fileName = `${branchFolder}/VP-${vpId} - ${detail.TR_NOMBRE}.pdf`.replace(/[<>:"/\\|?*]/g, '_');

                        archive.append(pdfBuffer, { name: fileName });

                        if ((i + 1) % 10 === 0 || i === details.length - 1) {
                            console.log(`[ZIP-API] Progreso: ${i + 1}/${details.length} PDFs listos.`);
                        }
                    } catch (pdfErr) {
                        console.error(`[ZIP-API] Error generando PDF para ${detail.TR_NOMBRE}:`, pdfErr);
                        // No detenemos todo el proceso por un PDF fallido, pero informamos
                    }
                }

                console.log(`[ZIP-API] Finalizando archivo ZIP...`);
                await archive.finalize();
                console.log(`[ZIP-API] ZIP finalizado correctamente.`);
            } catch (err: any) {
                console.error('[ZIP-API] Error fatal en bucle de generación:', err);
                passthrough.destroy(err);
            }
        })();

        const filename = `VOLANTES_${type}_${format(new Date(NM_FECHA_FIN), 'yyyy-MM-dd')}.zip`;

        return new Response(Readable.toWeb(passthrough) as any, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-cache',
            },
        });

    } catch (error) {
        console.error('[ZIP-API] Error general en el handler:', error);
        return NextResponse.json({ error: 'Error interno al generar el archivo' }, { status: 500 });
    }
}
