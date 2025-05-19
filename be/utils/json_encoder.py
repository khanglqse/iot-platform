from bson import ObjectId
from json import JSONEncoder
import datetime

class CustomJSONEncoder(JSONEncoder):
    """
    Custom JSON encoder to handle MongoDB BSON types
    """
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
        if isinstance(obj, datetime.date):
            return obj.isoformat()
        return super().default(obj)