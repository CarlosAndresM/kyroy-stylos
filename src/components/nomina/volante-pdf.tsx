import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Registrar fuentes si es necesario, o usar las estándar
// Nota: Se mantienen las fuentes de CDN pero se asegura que el componente sea apto para servidor
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
  fontWeight: 'light'
});
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
  fontWeight: 'normal'
});
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf',
  fontWeight: 'medium'
});
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
  fontWeight: 'bold'
});

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Roboto', color: '#1a202c' },
  header: { marginBottom: 20, borderBottom: 1, borderBottomColor: '#e2e8f0', paddingBottom: 10, alignItems: 'center' },
  logo: { width: 60, height: 60, marginBottom: 5 },
  companyName: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', color: '#000' },
  subtitle: { fontSize: 8, color: '#718096', marginTop: 2 },
  title: { fontSize: 12, fontWeight: 'bold', marginTop: 10, textAlign: 'center', textTransform: 'uppercase' },

  infoGrid: { flexDirection: 'row', marginBottom: 20, borderBottom: 1, borderBottomColor: '#edf2f7', paddingBottom: 10 },
  infoCol: { flex: 1 },
  infoRow: { flexDirection: 'row', marginBottom: 2 },
  infoLabel: { width: 80, fontSize: 8, color: '#718096', fontWeight: 'bold' },
  infoValue: { flex: 1, fontSize: 9, fontWeight: 'medium' },

  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', backgroundColor: '#f7fafc', padding: 4, marginBottom: 5, textTransform: 'uppercase' },

  table: { width: 'auto', borderStyle: 'solid', borderBottomWidth: 1, borderBottomColor: '#edf2f7' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f7fafc' },
  tableCellLabel: { flex: 3, padding: 4, fontSize: 9 },
  tableCellAmount: { flex: 1, padding: 4, fontSize: 9, textAlign: 'right' },
  tableHeader: { fontWeight: 'bold', color: '#718096', fontSize: 8, textTransform: 'uppercase' },

  totalRow: { flexDirection: 'row', marginTop: 5, padding: 4, backgroundColor: '#fcfcfc' },
  totalLabel: { flex: 3, fontWeight: 'bold', fontSize: 10 },
  totalAmount: { flex: 1, fontWeight: 'bold', fontSize: 10, textAlign: 'right' },

  netoContainer: { marginTop: 10, padding: 10, backgroundColor: '#f8fafc', borderTop: 2, borderTopColor: '#000', flexDirection: 'row', justifyContent: 'space-between' },
  netoLabel: { fontSize: 12, fontWeight: 'bold' },
  netoValue: { fontSize: 14, fontWeight: 'bold' },

  signatureGrid: { flexDirection: 'row', marginTop: 50, justifyContent: 'space-between' },
  signatureBox: { width: '40%', borderTop: 1, borderTopColor: '#a0aec0', paddingTop: 5, alignItems: 'center' },
  signatureText: { fontSize: 8, color: '#718096' },

  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', fontSize: 7, color: '#a0aec0' }
});

const fmt = (n: any) => {
  const val = Number(n) || 0;
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
};

export const VolantePDF = ({ data, logoUrl }: { data: any, logoUrl?: any }) => {
  const devengos = [
    { desc: 'Sueldo Base', val: Number(data.ND_BASE || 0) },
    { desc: 'Comisiones (SVC/PRD)', val: Number(data.ND_COMISIONES || 0) },
    { desc: 'Bonificaciones / Otros', val: Number(data.ND_BONOS || 0) },
  ].filter(i => i.val > 0);

  const deducciones = [
    { desc: 'Servicio Trabajador (Cuota)', val: Number(data.ND_DEDUCCIONES_SERVICIOS_TRABAJADOR || 0) },
    { desc: 'Vales / Adelantos (Cuota)', val: Number(data.ND_DEDUCCIONES_ADELANTOS || 0) },
  ].filter(i => i.val > 0);

  const totalDevengado = devengos.reduce((a, b) => a + b.val, 0);
  const totalDeducido = deducciones.reduce((a, b) => a + b.val, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {logoUrl && <Image src={logoUrl} style={styles.logo} />}
          <Text style={styles.companyName}>kairos STYLOS</Text>
          <Text style={styles.subtitle}>SANTIAGO DE CALI, COLOMBIA</Text>
          <Text style={styles.title}>Comprobante de Pago de Nómina</Text>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Colaborador:</Text>
              <Text style={styles.infoValue}>{data.TR_NOMBRE}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sucursal:</Text>
              <Text style={styles.infoValue}>{data.SC_NOMBRE || 'Principal'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cargo:</Text>
              <Text style={styles.infoValue}>{data.RL_NOMBRE || 'Colaborador'}</Text>
            </View>
          </View>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Periodo:</Text>
              <Text style={styles.infoValue}>{data.periodoRange || '---'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfono:</Text>
              <Text style={styles.infoValue}>{data.TR_TELEFONO || '---'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID Pago:</Text>
              <Text style={styles.infoValue}>VP-{data.ND_IDDETALLE_PK?.toString().padStart(5, '0')}</Text>
            </View>
          </View>
        </View>

        {/* Devengados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conceptos Devengados</Text>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellLabel}>Descripción</Text>
            <Text style={styles.tableCellAmount}>Valor</Text>
          </View>
          {devengos.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>{item.desc}</Text>
              <Text style={styles.tableCellAmount}>{fmt(item.val)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Devengado</Text>
            <Text style={styles.totalAmount}>{fmt(totalDevengado)}</Text>
          </View>
        </View>

        {/* Deducciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deducciones</Text>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellLabel}>Descripción</Text>
            <Text style={styles.tableCellAmount}>Valor</Text>
          </View>
          {deducciones.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>{item.desc}</Text>
              <Text style={[styles.tableCellAmount, { color: '#e53e3e' }]}>- {fmt(item.val)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Deducciones</Text>
            <Text style={[styles.totalAmount, { color: '#e53e3e' }]}>- {fmt(totalDeducido)}</Text>
          </View>
        </View>

        {/* Neto */}
        <View style={styles.netoContainer}>
          <Text style={styles.netoLabel}>NETO RECIBIDO</Text>
          <Text style={styles.netoValue}>{fmt(data.ND_TOTAL_NETO)}</Text>
        </View>

        <Text style={styles.footer}>
          Este documento es un comprobante informativo de liquidaci&oacute;n de n&oacute;mina.
          Generado el {new Date().toLocaleDateString('es-CO')}
        </Text>
      </Page>
    </Document>
  );
};
