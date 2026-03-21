import sys
import os
sys.path.append(os.getcwd())
from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    result = db.session.execute(text("SELECT DISTINCT category FROM prediction")).all()
    print("Unique Categories:", [r[0] for r in result])
    
    result_users = db.session.execute(text("SELECT DISTINCT category FROM user")).all()
    print("User Categories:", [r[0] for r in result_users])
