from pymongo import MongoClient
from datetime import datetime

# Kết nối MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["iot_db"]
raw_collection = db["sensor_data"]
summary_collection = db["sensor_summary"]

pipeline = [
    {
        "$group": {
            "_id": {
                "year": {"$year": "$timestamp"},
                "month": {"$month": "$timestamp"},
                "day": {"$dayOfMonth": "$timestamp"},
                "device_id": "$device_id"
            },
            "avg_temperature": {"$avg": "$temperature"},
            "max_temperature": {"$max": "$temperature"},
            "min_temperature": {"$min": "$temperature"},

            "avg_humidity": {"$avg": "$humidity"},
            "max_humidity": {"$max": "$humidity"},
            "min_humidity": {"$min": "$humidity"},

            "avg_light_level": {"$avg": "$light_level"},
            "max_light_level": {"$max": "$light_level"},
            "min_light_level": {"$min": "$light_level"},

            "avg_battery": {"$avg": "$battery_level"},
            "max_battery": {"$max": "$battery_level"},
            "min_battery": {"$min": "$battery_level"},

            "avg_soil_moisture": {"$avg": "$soil_moisture"},
            "max_soil_moisture": {"$max": "$soil_moisture"},
            "min_soil_moisture": {"$min": "$soil_moisture"},

            "record_count": {"$sum": 1}
        }
    },
    {
        "$sort": {"_id": 1}
    }
]

results = list(raw_collection.aggregate(pipeline))

summary_docs = []
for r in results:
    key = r["_id"]
    summary_date = datetime(key["year"], key["month"], key["day"])
    device_id = key["device_id"]
    
    doc = {
        "date": summary_date,
        "device_id": device_id,
        "record_count": r["record_count"],

        "avg_temperature": round(r["avg_temperature"], 2),
        "max_temperature": round(r["max_temperature"], 2),
        "min_temperature": round(r["min_temperature"], 2),

        "avg_humidity": round(r["avg_humidity"], 2),
        "max_humidity": round(r["max_humidity"], 2),
        "min_humidity": round(r["min_humidity"], 2),

        "avg_light_level": round(r["avg_light_level"], 2),
        "max_light_level": round(r["max_light_level"], 2),
        "min_light_level": round(r["min_light_level"], 2),

        "avg_battery": round(r["avg_battery"], 2),
        "max_battery": round(r["max_battery"], 2),
        "min_battery": round(r["min_battery"], 2),

        "avg_soil_moisture": round(r["avg_soil_moisture"], 2),
        "max_soil_moisture": round(r["max_soil_moisture"], 2),
        "min_soil_moisture": round(r["min_soil_moisture"], 2),
    }
    summary_docs.append(doc)

# Xoá dữ liệu cũ (tuỳ chọn)
summary_collection.delete_many({})

# Chèn dữ liệu mới
if summary_docs:
    summary_collection.insert_many(summary_docs)
    print(f"✅ Inserted {len(summary_docs)} summarized documents into 'sensor_summary'")
else:
    print("⚠️ No data found to summarize.")
