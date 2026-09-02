import asyncio
import sys

from sqlalchemy import select

from app.core.security import get_password_hash
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole, UserStatus
from app.services.auth_service import get_user_by_email


async def create_or_promote_admin(username="admin", email="admin@example.com", password="adminpassword"):
    async with AsyncSessionLocal() as session:
        # Check if email exists
        user = await get_user_by_email(session, email)
        if user:
            user.role = UserRole.ADMIN
            user.status = UserStatus.ACTIVE
            await session.commit()
            print(f"[SUCCESS] Promoted existing user '{email}' to ADMIN role.")
            return

        # Check if username exists
        res = await session.execute(select(User).where(User.username == username))
        existing_username = res.scalars().first()
        if existing_username:
            existing_username.role = UserRole.ADMIN
            existing_username.status = UserStatus.ACTIVE
            await session.commit()
            print(f"[SUCCESS] Promoted existing user with username '{username}' ({existing_username.email}) to ADMIN role.")
            return

        # Create new admin user
        new_admin = User(
            username=username,
            email=email,
            hashed_password=get_password_hash(password),
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
        )
        session.add(new_admin)
        await session.commit()
        print(f"[SUCCESS] Created new Admin Account:\n   Email: {email}\n   Password: {password}\n   Role: admin")


if __name__ == "__main__":
    email_arg = sys.argv[1] if len(sys.argv) > 1 else "admin@example.com"
    password_arg = sys.argv[2] if len(sys.argv) > 2 else "adminpassword"
    username_arg = sys.argv[3] if len(sys.argv) > 3 else "admin"

    asyncio.run(create_or_promote_admin(username_arg, email_arg, password_arg))
