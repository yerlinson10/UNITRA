## 1. Sinceridad Directa: Consideraciones de Arquitectura

1. **Monolito Modular con Inertia es la elección correcta:** Para un solo cliente no necesitas microservicios ni APIs REST/GraphQL desacopladas. Mantener todo en un solo repositorio con Inertia te dará la velocidad de desarrollo de Laravel con la interactividad de React y Shadcn.
2. **El inventario de teléfonos NO es un inventario tradicional:** No puedes simplemente tener una columna `stock_quantity = 10`. Cada teléfono es único y debe rastrearse individualmente por su **IMEI / Número de Serie**, su estado estético/funcional (ej. *Como nuevo, Grado B, Batería 85%*), su costo de entrada, precio monimo de venta y su origen.
3. **El flujo de Trade-In (Recibir teléfonos como pago):** Un teléfono recibido no es solo un descuento en la factura; es una **compra de inventario** integrada en una transacción de venta. Debe generar un registro de entrada de inventario (con su IMEI y costo) e ingresar formalmente a tu stock de usados.
4. **Gotenberg para PDFs:** Gotenberg ejecuta Chromium headless vía HTTP. Es perfecto para renderizar HTML/Tailwind a PDF con precisión de píxel. Mantendrás la misma consistencia visual que en el frontend.

---



## 2. Modelo de Datos Específico (Entidades Clave)

Para soportar las compras, retornos y ventas con números de serie/IMEI, te recomiendo esta estructura base de base de datos:

```
[Products] (ej. "iPhone 13 128GB")
   │
   ├──> [Inventory_Items] (IMEI, Serial, Estado, Costo_Compra, Status: disponible/vendido/reparacion)
   │
[Invoices] (Facturas)
   │
   ├──> [Invoice_Items] (Relacionado a Inventory_Item vendido y Precio_Venta)
   │
   └──> [Invoice_Trade_Ins] (Relacionado a nuevo Inventory_Item recibido como pago y Valor_Acreditado)

```



### Reglas clave del modelo

- `Inventory_Items`**:** Representa la unidad física. Tiene estados (`available`, `sold`, `in_repair`, `returned`).
- **Facturación con Trade-In:**

$$
\text{Monto a Pagar} = \sum(\text{Precio de Items}) - \sum(\text{Valor Acreditado por Trade-Ins})
$$

- **Contabilidad/Caja:** La transacción de venta debe registrar simultáneamente el ingreso de efectivo/tarjeta y el costo de adquisición del dispositivo recibido en inventario.

---



## 3. Arquitectura del Proyecto y Stack Recomendado

```
               ┌─────────────────────────────────────────┐
               │              Nginx Proxy                │
               └────────────────────┬────────────────────┘
                                    │
               ┌────────────────────▼────────────────────┐
               │           App Container (PHP 8.3)       │
               │   Laravel 11 + Inertia + React + Shadcn │
               └────────┬───────────────────┬────────────┘
                        │                   │
      ┌─────────────────▼──┐             ┌──▼────────────────┐
      │  MySQL / PostgreSQL │             │Gotenberg Container│
      │    (Persistence)   │             │  (HTML -> PDF)    │
      └────────────────────┘             └───────────────────┘

```



### Puntos clave de la arquitectura

- **Estado global ligero:** Usa Shadcn UI + Tailwind CSS. Para estados de formularios complejos en React (como el POS / Pantalla de facturación), apóyate en `useForm` de Inertia o `react-hook-form` con Zod.
- **Procesamiento de PDFs:** En lugar de llamar a Gotenberg síncronamente bloqueando la respuesta HTTP de la venta, procesa los comprobantes mediante **Laravel Queues** (utilizando Redis o la tabla `database`).
- **Contabilidad Simplificada:** No implementes un sistema contable de partida doble completo desde cero a menos que sea un requisito fiscal estricto. Implementa un **Libro Mayor de Caja / Flujo de Efectivo** (Ingresos, Egresos, Cierres de Caja Diarios/Turnos) y reportes de Utilidad Bruta ($\text{Precio Venta} - \text{Costo Adquisición IMEI}$).

---



## 4. Fases de Desarrollo Sugeridas

1. **Fase 1: Catálogo e Inventario por IMEI**

- Registro de productos base y carga de unidades físicas por IMEI/Serial.
- Módulo de compras/entradas de teléfonos a clientes finales (contratos de compraventa básicos para validar origen legal del equipo).

1. **Fase 2: Módulo POS & Facturación (Con Trade-In)**

- Interfaz de venta rápida: escaneo o búsqueda por IMEI.
- Opción de añadir "Teléfono a cambio": formulario rápido que registra el IMEI entrante, evalúa su costo y lo aplica como crédito a la factura.

1. **Fase 3: Generación de Documentos (Gotenberg)**

- Plantillas HTML/Tailwind para facturas y contratos de recepción de equipos usados.
- Envío a Gotenberg para exportar PDFs y guardar copias en almacenamiento local/S3.

1. **Fase 4: Caja, Contabilidad Básica y Reportes**

- Apertura/Cierre de caja (Arqueo).
- Reportes de ganancia neta considerando el margen real de los equipos recibidos a cambio cuando finalmente se vendan.

