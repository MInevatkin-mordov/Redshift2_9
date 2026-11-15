#!/usr/bin/env python3
"""Скачивает главные фото обсерваторий из Wikipedia в sky/assets/obs/<id>.jpg. Запуск: python download_obs_images.py
Фото из этой папки автоматически заменяют рисунки в режиме «Карточки» (Mega Science). Проверьте лицензии перед публикацией."""
import json, re, os, urllib.request
PAGES = {"bta": "Large_Altazimuth_Telescope", "pulkovo": "Pulkovo_Observatory", "crao": "Crimean_Astrophysical_Observatory",
         "gaish": "Sternberg_Astronomical_Institute", "kazan": "Engelhardt_Astronomical_Observatory", "kourovka": "Kourovka_Astronomical_Observatory",
         "sayan": "Sayan_Solar_Observatory", "ussuri": "Ussuriysk_Astrophysical_Observatory", "keck": "W._M._Keck_Observatory",
         "lasilla": "La_Silla_Observatory", "tololo": "Cerro_Tololo_Inter-American_Observatory", "paranal": "Paranal_Observatory",
         "teide": "Teide_Observatory", "greenwich": "Royal_Observatory,_Greenwich", "effelsberg": "Effelsberg_100-m_Radio_Telescope",
         "palomar": "Palomar_Observatory", "lick": "Lick_Observatory", "yerkes": "Yerkes_Observatory", "arecibo": "Arecibo_Observatory",
         "saao": "South_African_Astronomical_Observatory", "sidingspring": "Siding_Spring_Observatory", "nobeyama": "Nobeyama_Radio_Observatory",
         "fast": "Five-hundred-meter_Aperture_Spherical_Telescope"}
UA = {"User-Agent": "RedshiftSite/1.0 (educational project)"}
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sky", "assets", "obs"); os.makedirs(out, exist_ok=True)
def get(url): return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()
for id_, page in PAGES.items():
    try:
        info = json.loads(get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{page}"))
        src = (info.get("thumbnail") or info["originalimage"])["source"]
        src = re.sub(r"/\d+px-", "/800px-", src)
        open(os.path.join(out, id_ + ".jpg"), "wb").write(get(src)); print("OK ", id_, src)
    except Exception as e: print("ERR", id_, e)
print("Готово. Лицензии файлов смотрите на страницах Wikipedia/Commons.")
