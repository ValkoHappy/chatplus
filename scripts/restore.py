import os
import json
import urllib.parse
from pathlib import Path

history_dir = os.path.expandvars(r"%APPDATA%\Code\User\History")
target_prefix = "file:///b%3A/%D0%9F%D1%80%D0%BE%D0%B5%D0%BA%D1%82%D1%8B/%D0%9D%D0%BE%D0%B2%D0%B0%D1%8F%D0%93%D0%BB%D0%B0%D0%B2%D0%B0/CHATPLUS/cms/seed/generated/"
target_prefix_alt_2 = "file:///B%3A/%D0%9F%D1%80%D0%BE%D0%B5%D0%BA%D1%82%D1%8B/%D0%9D%D0%BE%D0%B2%D0%B0%D1%8F%D0%93%D0%BB%D0%B0%D0%B2%D0%B0/CHATPLUS".lower()
target_prefix_alt = "file:///b:/проекты/новаяглава/chatplus/cms/seed/generated/"

found_files = {}

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
            
        resource = data.get("resource", "")
        # Normalize resource url to compare easily
        unquoted = urllib.parse.unquote(resource).lower()
        unquoted = unquoted.replace("\\", "/")
        
        if "chatplus/cms/seed/generated/" in unquoted and unquoted.endswith(".json"):
            filename = unquoted.split("/")[-1]
            entries = data.get("entries", [])
            
            # Find the most recent entry that has content > 0 bytes
            # Entries are typically chronologically ordered, but we can sort by timestamp descending
            entries.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
            
            best_content = None
            for entry in entries:
                entry_id = entry.get("id")
                content_path = os.path.join(folder_path, entry_id)
                if os.path.exists(content_path):
                    with open(content_path, "r", encoding="utf-8") as cf:
                        text = cf.read()
                        if len(text) > 100:  # Valid files are large since they have SEO data
                            best_content = text
                            break
                            
            if best_content:
                found_files[filename] = len(best_content)
                # Actually restore it immediately to save time
                out_path = os.path.join(r"B:\Проекты\НоваяГлава\CHATPLUS\cms\seed\generated", filename)
                with open(out_path, "w", encoding="utf-8") as out_f:
                    out_f.write(best_content)
                    
    except Exception as e:
        pass

print("RESTORED FILES:", json.dumps(found_files, indent=2))
