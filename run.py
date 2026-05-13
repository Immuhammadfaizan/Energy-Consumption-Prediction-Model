from dotenv import load_dotenv
load_dotenv()
from app import create_app

app = create_app()

if __name__ == '__main__':
    # IMPORTANT: use_reloader=False prevents watchdog from restarting the server
    # mid-prediction. When n_jobs was -1, sklearn's multiprocessing wrote .pyc
    # files into Python's stdlib — watchdog detected those as code changes and
    # restarted Flask, dropping the prediction request ("Failed to fetch").
    # n_jobs=1 in predictor.py is the primary fix; this is a safety net.
    app.run(debug=True, threaded=True, use_reloader=False)