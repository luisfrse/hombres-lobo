# Genera lobo-app/public/i18n.js a partir de claves.py y motor.js
import json, sys
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from claves import K
m = open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'motor.js'), encoding='utf-8').read()
m = m.replace('/* Quest · i18n', '/* Homes llop · i18n').replace('Es el mismo archivo en las dos apps de Quest.', 'Archivo generado desde lobo-i18n/claves.py.')
dic = json.dumps({'ca': {k: v[0] for k, v in K.items()}, 'es': {k: v[1] for k, v in K.items()}}, ensure_ascii=False, indent=1)
open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'..','public','i18n.js'), 'w', encoding='utf-8').write(m.replace('/*__DICT__*/', dic))
print(len(K))
