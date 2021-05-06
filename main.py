from flask import Flask, request
import os


app = Flask(__name__)
app.config.from_object('config')