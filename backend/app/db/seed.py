"""Siembra el catálogo de Planes con los precios y cuotas definidos en el Backlog
(HU 2.1, 2.2, 2.3). Idempotente: no duplica planes ya existentes.
"""
from sqlalchemy.orm import Session

from app.models.enums import PlanCode
from app.models.subscription import Plan
from app.models.template import DocumentTemplate

_PLAN_SEED = [
    {"code": PlanCode.FREEMIUM.value, "name": "Freemium", "monthly_price_pen": 0, "included_pages": 50, "overage_price_per_page_pen": 0},
    {"code": PlanCode.BASICO.value, "name": "Básico", "monthly_price_pen": 50, "included_pages": 500, "overage_price_per_page_pen": 0.15},
    {"code": PlanCode.CRECIMIENTO.value, "name": "Crecimiento", "monthly_price_pen": 150, "included_pages": 2000, "overage_price_per_page_pen": 0.09},
    {"code": PlanCode.CORPORATIVO.value, "name": "Corporativo", "monthly_price_pen": 400, "included_pages": 7000, "overage_price_per_page_pen": 0.06},
]

_GLOBAL_TEMPLATES = [
    {
        "name": "Recibo de Agua (Sedapal)",
        "description": "Recibo de servicio de agua potable y alcantarillado.",
        "field_definitions": [
            {"name": "ruc_emisor", "label": "RUC Emisor"},
            {"name": "numero_recibo", "label": "Número de Recibo"},
            {"name": "numero_suministro", "label": "N° de Suministro"},
            {"name": "importe_total", "label": "Importe Total a Pagar"},
            {"name": "fecha_vencimiento", "label": "Fecha de Vencimiento"},
            {"name": "fecha_emision", "label": "Fecha de Emisión"},
            {"name": "periodo_consumo", "label": "Período de Consumo"},
            {"name": "mes_facturado", "label": "Mes Facturado"},
            {"name": "consumo_m3", "label": "Consumo (m³)"},
        ],
    },
    {
        "name": "Recibo de Luz",
        "description": "Recibo de servicio eléctrico (Luz del Sur, Enel, etc.).",
        "field_definitions": [
            {"name": "ruc_emisor", "label": "RUC Emisor"},
            {"name": "numero_suministro", "label": "N° de Suministro"},
            {"name": "numero_recibo", "label": "Número de Recibo"},
            {"name": "importe_total", "label": "Total a Pagar"},
            {"name": "fecha_vencimiento", "label": "Fecha de Vencimiento"},
            {"name": "fecha_emision", "label": "Fecha de Emisión"},
            {"name": "consumo_kwh", "label": "Consumo (kWh)"},
            {"name": "igv", "label": "IGV"},
        ],
    },
    {
        "name": "Recibo de Gas",
        "description": "Recibo de servicio de gas natural.",
        "field_definitions": [
            {"name": "ruc_emisor", "label": "RUC Emisor"},
            {"name": "numero_suministro", "label": "N° de Suministro"},
            {"name": "importe_total", "label": "Total a Pagar"},
            {"name": "fecha_vencimiento", "label": "Fecha de Vencimiento"},
            {"name": "fecha_emision", "label": "Fecha de Emisión"},
            {"name": "consumo_m3", "label": "Consumo (m³)"},
        ],
    },
    {
        "name": "Factura Electrónica SUNAT",
        "description": "Factura, boleta o guía de remisión electrónica.",
        "field_definitions": [
            {"name": "ruc_emisor", "label": "RUC Emisor"},
            {"name": "ruc_receptor", "label": "RUC Receptor"},
            {"name": "serie_correlativo", "label": "Serie-Correlativo"},
            {"name": "fecha_emision", "label": "Fecha de Emisión"},
            {"name": "monto_total", "label": "Monto Total"},
            {"name": "igv", "label": "IGV"},
        ],
    },
]


def seed_plans(db: Session) -> None:
    existing_codes = {code for (code,) in db.query(Plan.code).all()}
    for plan_data in _PLAN_SEED:
        if plan_data["code"] not in existing_codes:
            db.add(Plan(**plan_data))

    existing_template_names = {name for (name,) in db.query(DocumentTemplate.name).where(DocumentTemplate.user_id.is_(None)).all()}
    for tpl_data in _GLOBAL_TEMPLATES:
        if tpl_data["name"] not in existing_template_names:
            db.add(DocumentTemplate(user_id=None, **tpl_data))

    db.commit()
