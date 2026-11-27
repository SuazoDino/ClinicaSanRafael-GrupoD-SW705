"""Tiempo de ciclo de los pull requests: desde que se abren hasta que se fusionan."""
import csv
import sys
from datetime import datetime
from statistics import median


def main(ruta):
    with open(ruta, newline="", encoding="utf-8") as f:
        filas = list(csv.DictReader(f))
    tiempos = []
    print("PR    Historia  Dias")
    for r in filas:
        dias = (datetime.fromisoformat(r["fusionado"]) - datetime.fromisoformat(r["abierto"])).total_seconds() / 86400
        tiempos.append(dias)
        print(f"#{r['pr']:<4} {r['historia']:<8} {dias:>5.1f}")
    print(f"\nPull requests fusionados: {len(tiempos)}")
    print(f"Tiempo de ciclo: mediana {median(tiempos):.1f} dias | maximo {max(tiempos):.1f} dias")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "prs.csv")
