# 2015-05-notrecht-ruestungsexporte
# 

## Artikel

Die Daten und Methoden in diesem Repository beziehen sich auf den Artikel [Notrecht als letztes Mittel gegen heikle Rüstungsexporte](http://www.srf.ch/news/schweiz/notrecht-als-letztes-mittel-gegen-heikle-ruestungsexporte), publiziert am 21. Mai 2015. 

## Beschreibung

### Vorprozessierung und Analyse

Der Ordner `analysis` beinhaltet die Prozessierungsschritte (inkl. explorativer Analyse) in R. Der ganze Prozess steht ebenfalls [unter diesem Link](http://srfdata.github.io/2015-05-notrecht-ruestungsexporte/) als HTML-File zur Verfügung. 

### Frontend

Die [Visualisierung](http://www.srfcdn.ch/srf-data/data/2015/seco-dual-use/) wurde mit dem Javascript-Framework [D3](http://d3js.org) implementiert. Als Build-Tool wurde [Grunt](http://gruntjs.com/) verwendet. [Bower](http://bower.io/) und [npm](https://www.npmjs.com/) wurden als Package-Management-Systeme eingesetzt.

#### Befehle

* `npm install` - Installiert alle benötigten Node-Packages

* `npm install node-sass && npm install grunt-sass` - Diese beiden Packages müssen wegen einem Fehler in `node-sass` manuell installiert werden

* `bower install` - Installiert alle benötigten Frontend-Dependencies

* `grunt serve` - Startet einen Entwicklungsserver auf localhost:8000

* `grunt build` - Minifiziert die Sourcen und kopiert sie in den `dist`-Ordner

#### Fonts

Die SRGSSR-Fonts wurden aus Urheberrechtsgründen aus dem Ordner `frontend/app/fonts/` entfernt. 

## Haftungsausschluss

Die veröffentlichten Informationen sind sorgfältig zusammengestellt, erheben aber keinen Anspruch auf Aktualität, Vollständigkeit oder Richtigkeit. Es wird keine Haftung übernommen für Schäden, die  durch die Verwendung dieses Scripts oder der daraus gezogenen Informationen entstehen. Dies gilt ebenfalls für Inhalte Dritter, die über dieses Angebot zugänglich sind. 

## Lizenz

<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/"><img alt="Creative Commons Lizenzvertrag" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" /></a><br /><span xmlns:dct="http://purl.org/dc/terms/" href="http://purl.org/dc/dcmitype/Dataset" property="dct:title" rel="dct:type">2015-05-notrecht-ruestungsexporte</span> von <a xmlns:cc="http://creativecommons.org/ns#" href="https://github.com/srfdata/2015-05-notrecht-ruestungsexporte" property="cc:attributionName" rel="cc:attributionURL">SRF Data</a> ist lizenziert unter einer <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Namensnennung - Nicht-kommerziell - Weitergabe unter gleichen Bedingungen 4.0 International Lizenz</a>.

## Kontakt

Bei Fragen wenden Sie sich bitte an timo.grossenbacher(at)srf.ch oder an [@srfdata](https://twitter.com/srfdata)