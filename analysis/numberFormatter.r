formatAsChf <- function(number){
  return(paste("CHF ", formatAsChfWithoutCHF(number), sep=""))
}

formatAsChfWithoutCHF <- function(number){
  return(paste(format(number, decimal.mark = ".", big.mark = "'"), ".-", sep=""))
}