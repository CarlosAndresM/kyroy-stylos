# 📋 Documento de Arquitectura y Requerimientos: Sistema de Gestión Multi-Sucursal

## 1. Roles del Sistema
* **Administrador Total:** Acceso global a todas las sucursales, métricas, nóminas y control total.
* **Administración Local (Cajero):** Acceso restringido a las operaciones de su propia sucursal.
* **Técnico:** Empleado que realiza el servicio (se asocia a las facturas y vales).

## 2. Definiciones Base (Sin valores fijos)
* **Servicios:** Se definen en el sistema para estar disponibles, pero **no se les asigna precio**. El valor exacto fluctúa (ej. 30 mil a un cliente, 20 mil a otro) y será escrito manualmente en la factura por el encargado.
* **Productos:** Se crean para tenerlos disponibles en la lista, pero al igual que los servicios, su valor se asigna manualmente al momento de agregarlos a una factura.
* **Sucursales:** Definición de los locales físicos del negocio.
* **Trabajadores:** Se pueden crear, activar o desactivar (para manejar despidos o renuncias). Los cargos son "Técnico" y "Cajero".

## 3. Módulo de Facturación (Vista Principal)
La vista principal tendrá tablas y un botón **"+"** que abrirá un modal con un diseño tipo "factura de hoja".
* **Comportamiento Dinámico:** Permite indicar el Técnico, el Servicio, el Valor y agregar Productos adicionales mediante un botón "+" para añadir nuevas filas.
* **Edición:** Las facturas son editables si están en estado "Pendiente", permitiendo agregar más cosas a medida que transcurre el tiempo del servicio. Una vez pasada a "Pagada" o "Cancelada", el cajero no puede editarla. Al cerrar nómina, se bloquea y solo el Administrador puede editarla usando una contraseña.
* **Métodos de Pago:** Transferencia, Efectivo, Datáfono, Crédito, Vales.
* **Evidencia de Pago:** Todos los métodos de pago (incluyendo efectivo opcionalmente) tendrán la opción de adjuntar una foto de evidencia (ej. captura de transferencia, foto de comprobante).
* **Pagos Mixtos:** Si se elige más de un método, el sistema pedirá cuánto dinero va para cada uno. Ejemplo de factura de 35 mil: 20 mil Transferencia, 5 mil Efectivo y 10 mil Crédito (queda debiendo 10 mil).

## 4. Gestión de Clientes, Créditos y Vales
* **Clientes (Sin registro previo):** **No existe un módulo para registrar clientes previamente.** El listado de clientes se conforma dinámicamente juntando todos los registros que tengan el mismo número de teléfono ingresado manualmente al crear las facturas.
* **Créditos (Deudas de clientes):** Se busca al cliente (usando su teléfono) o el número de factura para ver sus créditos pendientes. Cuando el cliente hace un abono, se registra el pago hasta cambiar el estado de la factura de "Pendiente" a "Cobrado/Pagado".
* **Vales (Créditos a Empleados):** Servicios realizados entre los mismos trabajadores. Al definir en la factura que el "Cliente" es un "Técnico", se habilita el método de pago **Vale**.
    * Se define a cuántas cuotas se paga y el valor de la cuota.
    * **Regla de Cuotas y Nómina:** Las cuotas son semanales. El sistema funciona de Domingo a Sábado (cierre cada 7 días). El sistema debe calcular los días reales del mes. El vale se descuenta automáticamente en el cierre de nómina.

## 5. Control de Gastos y Solicitudes
* **Solicitudes de Productos:** Cada local tiene un apartado para pedir insumos indicando producto y cantidad. El administrador lo lleva y cambia el estado a "Entregado". (No maneja stock por ahora, pero queda preparado para el futuro).
* **Gastos:** Registro de salidas (ej. Compra de productos, arriendo, servicios, o la compra del sistema). Se debe especificar si el gasto es para una sucursal específica o es general del negocio.

---

## 6. Vistas del Sistema

### A. PANEL ADMINISTRATIVO (Sidebar Izquierdo)
* **Dashboard General:**
    * Muestra tarjetas de los locales. Al hacer clic en un local, muestra métricas: Total ventas hoy, total productos hoy, créditos, gastos, vales, solicitudes, ingresos y salidas totales.
    * Ganancia general discriminada por: Transferencia, Efectivo, Datáfono, Vales, Créditos. Y un "Total Real" sin contar vales ni créditos pendientes.
    * Gráfico de Top Empleados con más servicios.
    * *Region Display Selector:* Alterna entre vista "General" (gráficos) y vista "Específica" (tablas).
* **Clientes:** Listado generado automáticamente agrupando por teléfono, para ver cuánto debe cada uno en caso de método Crédito.
* **Trabajadores:** Ver vales, cuotas pagadas, créditos pendientes y cantidad de servicios realizados.
* **Servicios / Productos / Facturas:** Listados generales.
* **Vales:** Total de vales en tablas.
* **Solicitudes de Productos:** Ver pedidos de locales.
* **Nómina:** Para gestionar pagos, cerrar nóminas semanales y ver históricos.

### B. PANEL LOCAL ROL CAJERO (Sidebar Izquierdo)
* **Dashboard Local:** Solo ve el apartado "Específico" (las 5 tablas) de su sucursal. Puede agregar y editar facturas (si no están pagadas).
* **Clientes:** Solo lectura.
* **Trabajadores / Vales:** Ver y visualizar sus propios vales.
* **Servicios / Productos:** Puede crearlos, pero NO editarlos.
* **Solicitudes de Productos:** Para pedir a la administración.

---

## 7. Estructura de Tablas (Apartado "Específico" en Dashboards)

Esta vista concentra la operación y constará de 5 tablas:

1.  **VENTAS:**
    * *Campos:* Factura | Fecha | Servicio | Técnico(s) | Cliente (o Técnico para Vales) | Celular Cliente | Métodos de Pago | Valor Total | Estado (Pendiente, Pagado, Cancelado).
    * *Funcionalidad:* Botón "+" para agregar. Alimenta directamente la tabla de Productos Usados.
2.  **PRODUCTOS (Usados en factura):**
    * *Campos:* Factura | Fecha Producto | Valor | Técnico | Servicio donde se usó.
3.  **CRÉDITOS:**
    * *Campos:* Factura | Fecha | Cliente | Valor.
4.  **GASTOS:**
    * *Campos:* Concepto | Fecha | Valor.
5.  **VALES:**
    * *Campos:* Factura | Fecha | Valor | Cuotas | Estado (Pendiente, Pagado, Cancelado).
 