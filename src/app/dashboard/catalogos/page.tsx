import { Metadata } from "next";
import { getServices, getProducts } from "@/features/catalog/services";
import { CatalogClient } from "@/app/dashboard/catalogos/catalog-client";

export const metadata: Metadata = {
  title: "Catálogos | Kyroy Stilos",
  description: "Gestión de servicios y productos",
};

export default async function CatalogosPage() {
  const [servicesRes, productsRes] = await Promise.all([
    getServices(),
    getProducts(),
  ]);

  const services = servicesRes.success ? servicesRes.data : [];
  const products = productsRes.success ? productsRes.data : [];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Catálogos
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Administra los <span className="text-[#FF7E5F] font-bold">servicios</span> y <span className="text-[#FF7E5F] font-bold">productos</span> ofrecidos en tus sucursales.
        </p>
      </div>

      <CatalogClient 
        initialServices={services as any[]} 
        initialProducts={products as any[]} 
      />
    </div>
  );
}
