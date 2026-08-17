"""Enumeraciones compartidas del dominio."""
import enum


class PlanCode(str, enum.Enum):
    FREEMIUM = "freemium"
    BASICO = "basico"
    CRECIMIENTO = "crecimiento"
    CORPORATIVO = "corporativo"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"


class ProcessingMode(str, enum.Enum):
    EXPRESS = "express"
    ALMACENADO = "almacenado"


class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentType(str, enum.Enum):
    SUNAT_FACTURA = "sunat_factura"
    SUNAT_BOLETA = "sunat_boleta"
    SUNAT_GUIA_REMISION = "sunat_guia_remision"
    DNI_AZUL = "dni_azul"
    DNI_ELECTRONICO = "dni_electronico"
    TICKET_TERMICO = "ticket_termico"
    DESCONOCIDO = "desconocido"


class CreditTransactionType(str, enum.Enum):
    CONSUMPTION = "consumption"
    MONTHLY_RESET = "monthly_reset"
    PRORATION_ADJUSTMENT = "proration_adjustment"
    OVERAGE = "overage"


class InvoiceStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"


class ArcoRightType(str, enum.Enum):
    ACCESO = "acceso"
    RECTIFICACION = "rectificacion"
    CANCELACION = "cancelacion"
    OPOSICION = "oposicion"


class ArcoRequestStatus(str, enum.Enum):
    PENDIENTE = "pendiente"
    EN_PROCESO = "en_proceso"
    COMPLETADA = "completada"
    RECHAZADA = "rechazada"
