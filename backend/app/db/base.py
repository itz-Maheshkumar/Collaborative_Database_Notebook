from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models.

    Import this in every model module and subclass it:
        class User(Base):
            __tablename__ = "users"
            ...
    """
    pass
