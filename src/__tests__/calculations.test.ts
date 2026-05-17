import { describe, it, expect } from 'vitest';
import {
  calculateEMI,
  getLTVBand,
  getMaxLoanByLTV,
  getEffectivePropertyValue,
  calcLTVPercent,
  calcFOIR,
  calcAgeAtMaturity,
  getTypicalMaturityAge,
  calcMaxLoanByRepaymentCapacity,
} from '../engine/calculations';

describe('calculateEMI', () => {
  it('calculates correct EMI for standard inputs', () => {
    // ₹50L at 8.75% for 20 years
    const emi = calculateEMI(50_00_000, 8.75, 240);
    expect(emi).toBeGreaterThan(44000);
    expect(emi).toBeLessThan(46000);
  });

  it('returns 0 for zero principal', () => {
    expect(calculateEMI(0, 8.75, 240)).toBe(0);
  });

  it('returns 0 for zero tenure', () => {
    expect(calculateEMI(50_00_000, 8.75, 0)).toBe(0);
  });

  it('returns 0 for zero rate', () => {
    expect(calculateEMI(50_00_000, 0, 240)).toBe(0);
  });

  it('EMI decreases as tenure increases', () => {
    const emi20 = calculateEMI(50_00_000, 8.75, 240);
    const emi30 = calculateEMI(50_00_000, 8.75, 360);
    expect(emi30).toBeLessThan(emi20);
  });

  it('EMI increases as rate increases', () => {
    const emiLow = calculateEMI(50_00_000, 8.0, 240);
    const emiHigh = calculateEMI(50_00_000, 9.15, 240);
    expect(emiHigh).toBeGreaterThan(emiLow);
  });
});

describe('getLTVBand', () => {
  it('returns 90% band for properties ≤ 30L', () => {
    expect(getLTVBand(20_00_000).maxLTV).toBe(0.90);
    expect(getLTVBand(30_00_000).maxLTV).toBe(0.90);
  });

  it('returns 80% band for properties 30L–75L', () => {
    expect(getLTVBand(50_00_000).maxLTV).toBe(0.80);
    expect(getLTVBand(75_00_000).maxLTV).toBe(0.80);
  });

  it('returns 75% band for properties above 75L', () => {
    expect(getLTVBand(80_00_000).maxLTV).toBe(0.75);
    expect(getLTVBand(2_00_00_000).maxLTV).toBe(0.75);
  });
});

describe('getMaxLoanByLTV', () => {
  it('calculates correct max loan for 90% band', () => {
    expect(getMaxLoanByLTV(25_00_000)).toBe(22_50_000); // 25L * 0.9
  });

  it('calculates correct max loan for 80% band', () => {
    expect(getMaxLoanByLTV(50_00_000)).toBe(40_00_000); // 50L * 0.8
  });

  it('calculates correct max loan for 75% band', () => {
    expect(getMaxLoanByLTV(1_00_00_000)).toBe(75_00_000); // 1Cr * 0.75
  });
});

describe('getEffectivePropertyValue', () => {
  it('returns lower of market and agreement when flag is true', () => {
    expect(getEffectivePropertyValue(85_00_000, 82_00_000, true)).toBe(82_00_000);
    expect(getEffectivePropertyValue(80_00_000, 85_00_000, true)).toBe(80_00_000);
  });

  it('returns market value when flag is false', () => {
    expect(getEffectivePropertyValue(85_00_000, 82_00_000, false)).toBe(85_00_000);
  });

  it('returns market value when agreement value is 0', () => {
    expect(getEffectivePropertyValue(85_00_000, 0, true)).toBe(85_00_000);
  });
});

describe('calcLTVPercent', () => {
  it('returns correct LTV percentage', () => {
    expect(calcLTVPercent(60_00_000, 80_00_000)).toBeCloseTo(0.75, 5);
    expect(calcLTVPercent(27_00_000, 30_00_000)).toBeCloseTo(0.90, 5);
  });

  it('returns 0 for zero property value', () => {
    expect(calcLTVPercent(50_00_000, 0)).toBe(0);
  });
});

describe('calcFOIR', () => {
  it('returns correct FOIR', () => {
    expect(calcFOIR(50_000, 1_00_000)).toBe(0.5);
    expect(calcFOIR(40_000, 1_00_000)).toBe(0.4);
  });

  it('returns 0 for zero income', () => {
    expect(calcFOIR(50_000, 0)).toBe(0);
  });
});

describe('calcAgeAtMaturity', () => {
  it('calculates age at maturity correctly', () => {
    expect(calcAgeAtMaturity(30, 240)).toBe(50); // 30 + 20 years
    expect(calcAgeAtMaturity(35, 300)).toBeCloseTo(60, 0);
  });
});

describe('getTypicalMaturityAge', () => {
  it('returns 60 for salaried', () => {
    expect(getTypicalMaturityAge('salaried')).toBe(60);
  });

  it('returns 65 for self-employed', () => {
    expect(getTypicalMaturityAge('self_employed')).toBe(65);
  });
});

describe('calcMaxLoanByRepaymentCapacity', () => {
  it('returns positive loan amount for sufficient income', () => {
    const max = calcMaxLoanByRepaymentCapacity(1_00_000, 10_000, 'salaried', 8.75, 240);
    expect(max).toBeGreaterThan(0);
  });

  it('returns 0 when existing EMIs consume all available FOIR capacity', () => {
    // If existing EMIs already at 60% of income, no room for new loan
    const max = calcMaxLoanByRepaymentCapacity(1_00_000, 60_000, 'salaried', 8.75, 240);
    expect(max).toBe(0);
  });
});
