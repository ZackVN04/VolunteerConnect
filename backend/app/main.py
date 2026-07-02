from fastapi import FastAPI

app = FastAPI(title='Volunteer Connect API')

@app.get('/')
def root():
    return {'message': 'Welcome to Volunteer Connect API'}
