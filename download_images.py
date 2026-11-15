#!/usr/bin/env python3
"""Скачивает главные фото объектов из Wikipedia в assets/img/<id>.jpg. Запуск: python download_images.py"""
import json, re, os, urllib.request
PAGES = {"ceres": "Ceres_(dwarf_planet)", "pluto": "Pluto", "haumea": "Haumea", "makemake": "Makemake",
         "eris": "Eris_(dwarf_planet)", "gonggong": "Gonggong_(dwarf_planet)", "quaoar": "50000_Quaoar",
         "orcus": "90482_Orcus", "sedna": "90377_Sedna", "salacia": "120347_Salacia"}
UA = {"User-Agent": "RedshiftSite/1.0 (educational project)"}
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "img"); os.makedirs(out, exist_ok=True)
def get(url): return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()
for id_, page in PAGES.items():
    try:
        info = json.loads(get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{page}"))
        src = (info.get("thumbnail") or info["originalimage"])["source"]
        src = re.sub(r"/\d+px-", "/800px-", src)
        open(os.path.join(out, id_ + ".jpg"), "wb").write(get(src)); print("OK ", id_, src)
    except Exception as e: print("ERR", id_, e)
print("Готово. Лицензии файлов смотрите на страницах Wikipedia/Commons (многие — NASA, общественное достояние).")
