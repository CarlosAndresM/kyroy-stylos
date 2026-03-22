import { Metadata } from "next";
import { getRecentInvoices, getTechnicians, getPaymentMethods } from "@/features/billing/services";
import { getServices, getProducts } from "@/features/catalog/services";
import { BillingClient } from "@/app/dashboard/ventas/billing-client";

export const metadata: Metadata = {
  title: "Ventas | Kyroy Stilos",
  description: "Gestión de facturación y ventas diarias",
};

export default async function VentasPage() {
  // Datos necesarios para la operación
  const [
    invoicesRes,
    techniciansRes,
    servicesRes,
    productsRes,
    paymentMethodsRes
  ] = await Promise.all([
    getRecentInvoices(1), // Sucursal 1 por defecto por ahora
    getTechnicians(),
    getServices(),
    getProducts(),
    getPaymentMethods()
  ]);

  const invoices = invoicesRes.success ? invoicesRes.data : [];
  const technicians = techniciansRes.success ? techniciansRes.data : [];
  const services = servicesRes.success ? servicesRes.data : [];
  const products = productsRes.success ? productsRes.data : [];
  const paymentMethods = paymentMethodsRes.success ? paymentMethodsRes.data : [];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Ventas y Facturación
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Registras servicios, productos y pagos en tiempo real para la <span className="text-[#FF7E5F] font-bold">Sucursal Central</span>.
        </p>
      </div>

      <BillingClient
        initialInvoices={invoices as any[]}
        technicians={technicians as any[]}
        services={services as any[]}
        products={products as any[]}
        paymentMethods={paymentMethods as any[]}
      />
    </div>
  );
}
