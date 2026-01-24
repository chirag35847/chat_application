migrate:
	cd backend && npx prisma migrate dev --name $(name)
