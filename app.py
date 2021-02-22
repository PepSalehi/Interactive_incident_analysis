from flask import Flask
from flask import render_template
# from pymongo import MongoClient


app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")



if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5100, debug=True, use_reloader=True)
    # app.run( debug=True, use_reloader=True)