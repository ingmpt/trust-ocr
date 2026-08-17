"""Siembra el catálogo de Planes con los precios y cuotas definidos en el Backlog
(HU 2.1, 2.2, 2.3). Idempotente: no duplica planes ya existentes.
"""
from sqlalchemy.orm import Session

from app.models.enums import PlanCode
from app.models.subscription import Plan

_PLAN_SEED = [
    {"code": PlanCode.FREEMIUM.value, "name": "Freemium", "monthly_price_pen": 0, "included_pages": 50, "overage_price_per_page_pen": 0},
    {"code": PlanCode.BASICO.value, "name": "Básico", "monthly_price_pen": 50, "included_pages": 500, "overage_price_per_page_pen": 0.15},
    {"code": PlanCode.CRECIMIENTO.value, "name": "Crecimiento", "monthly_price_pen": 150, "included_pages": 2000, "overage_price_per_page_pen": 0.09},
    {"code": PlanCode.CORPORATIVO.value, "name": "Corporativo", "monthly_price_pen": 400, "included_pages": 7000, "overage_price_per_page_pen": 0.06},
]


def seed_plans(db: Session) -> None:
    existing_codes = {code for (code,) in db.query(Plan.code).all()}
    for plan_data in _PLAN_SEED:
        if plan_data["code"] not in existing_codes:
            db.add(Plan(**plan_data))
    db.commit()
