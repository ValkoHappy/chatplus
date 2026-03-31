import os
import json

history_dir = os.path.expandvars(r"%APPDATA%\Code\User\History")

for folder in os.listdir(history_dir):
    folder_path = os.path.join(history_dir, folder)
    if not os.path.isdir(folder_path):
        continue
        
    entries_file = os.path.join(folder_path, "entries.json")
    if not os.path.exists(entries_file):
        continue
        
    try:
        with open(entries_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        resource = data.get("resource", "").lower()
        # Decode ONLY for display matching
        import urllib.parse
        decoded = urllib.parse.unquote(resource)
        
        if "chatplus" in decoded and "generated" in decoded and ".json" in decoded:
            print(f"[{folder}] -> {decoded}")
            
    except Exception as e:
        pass
