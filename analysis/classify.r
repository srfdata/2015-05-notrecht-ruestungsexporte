classifyVerzeichnis <- function(VerordnungTracker, VerordnungELIC, Signatur){
  Verzeichnis <- NA
  Herkunft <- NA
  code <- if(is.na(VerordnungTracker)) VerordnungELIC else VerordnungTracker
  Herkunft <- if(is.na(VerordnungTracker)) "ELIC" else "Tracker"
  # Wenn zwei Codes aufgeführt sind, nur den ersten nehmen
  if(grepl("\n", code)){
    code <- strsplit(code,"\n")[[1]][1]
  }
  # Wenn Verordnung bereits gegeben ist 
  if(code == "ML..GKV."  | 
              code == "Besondere militärische Güter"){
    Verzeichnis <- "ML (GKV)"
  } else if(code == "NSGI..GKV." | 
              code == "NSGII..GKV." | 
              code == "MTCR..GKV." | 
              code == "AG..GKV." | 
              code == "WA..GKV." |
              code == "Dual Use Güter" |
              code == "Nukleargüter"){
    Verzeichnis <- "GKV"
  } else if(code == "ChKV" |
              code == "Chemikalien CWÜ"){
    Verzeichnis <- "ChKV"
    # Anhang (Tracker)
  } else if(grepl("Anhang", code)){
    Verzeichnis <- strsplit(code,"ng.")[[1]][2]
    # Anhang (ELIC)
  } else if(code == "National kontrollierte Güter"){
    Verzeichnis <- Signatur
    # Wenn Verordnung unbekannt ist
  } else if(code == "unbekannt" | code == "Sanktionsgüter"){
    Verzeichnis <- "unbekannt"
  } 
  return(c(Verzeichnis, Herkunft))
}

classifySignatur <- function(Verzeichnis, Herkunft, Signatur){
  Haupttyp <- NA
  Untertyp <- NA
  Zusatz <- NA
  
  code <- Signatur
  
  # Wenn zwei Codes aufgeführt sind, nur den ersten nehmen
  if (grepl("\n", code)){
    code <- strsplit(code,"\n")[[1]][1]
  }
  # ML (GKV)
  if (Verzeichnis == "ML (GKV)") {
    if(Herkunft == "ELIC") {
      Haupttyp <- if(substring(code, 3, 3) == "0") substring(code, 4, 4) else substring(code, 3, 4)
      UntertypPre <- gsub("\\.", "", substring(code, 5))
      Untertyp <- if(UntertypPre != "") tolower(UntertypPre) else NA
    } 
    if(Herkunft == "Tracker") {
      HaupttypPosition <- regexpr("^[0-9]{1,2}", code, useBytes = F)
      HaupttypPre <- substring(code, HaupttypPosition, attributes(HaupttypPosition)$match.length)
      Haupttyp <- if(substring(HaupttypPre, 1, 1) == "0") substring(HaupttypPre, 2, 2) else HaupttypPre
      UntertypPre <- substring(code, HaupttypPosition + attributes(HaupttypPosition)$match.length)
      Untertyp <- if(UntertypPre != "") tolower(UntertypPre) else NA
    }
  # GKV
  } else if (Verzeichnis == "GKV"){
    Haupttyp <- substring(code, 1, 1)
    Untertyp <- toupper(substring(code, 2, 2))
    Zusatz <- gsub("\\.", "", substring(code, 3))
    # solche mit komischer GKV-Signatur (z.B. 5.00E+02 aka 500)
    if (Untertyp == "."){
      Haupttyp <- "unbekannt"
      Untertyp <- NA
      Zusatz <- NA
    }
  # ChKV
  } else if (Verzeichnis == "ChKV"){
    Haupttyp <- substring(code, 1, 2)
    UntertypPre <- gsub("\\.", "", substring(code, 3))
    Untertyp <- if(UntertypPre != "") UntertypPre else NA
  # Unbekannt
  } else if (Verzeichnis == "unbekannt"){
    Haupttyp <- NA
    Untertyp <- NA
    Zusatz <- NA
  # Sonstiges (Anhänge)
  } else {
    Haupttyp <- Verzeichnis
  }
  return(c(Haupttyp, Untertyp, Zusatz))
}