from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "budgetMe Backend is running"}