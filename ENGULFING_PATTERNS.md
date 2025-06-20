# Engulfing Pattern Detection Logic

## What We Detect (TRUE REVERSAL PATTERNS ONLY)

### ✅ BULLISH ENGULFING (Bullish Reversal)
```
Previous: RED/Bearish candle (close < open)
Current:  GREEN/Bullish candle (close > open)

Pattern: Green candle ENGULFS red candle
Signal:  Potential upward reversal
```

### ✅ BEARISH ENGULFING (Bearish Reversal)
```
Previous: GREEN/Bullish candle (close > open)  
Current:  RED/Bearish candle (close < open)

Pattern: Red candle ENGULFS green candle
Signal:  Potential downward reversal
```

## What We DON'T Detect (Not Meaningful)

### ❌ SAME COLOR ENGULFING
```
Red engulfing red   = NO SIGNAL (continuation, not reversal)
Green engulfing green = NO SIGNAL (continuation, not reversal)
```

## Enhanced Filtering Rules

1. **Opposite Colors Required**: Current and previous candles must be opposite colors
2. **Size Requirement**: Current body must be 1.5x bigger than previous body
3. **Meaningful Previous**: Previous candle body must be 30% of its range (not a doji)
4. **Strong Current**: Current candle body must be 50% of its range (strong move)
5. **Price Movement**: Minimum 0.5% price change required
6. **True Engulfing**: Current candle must completely engulf previous candle body

## Example Valid Patterns

### Bullish Engulfing
```
Previous: Red candle (open: 100, close: 98)
Current:  Green candle (open: 97, close: 102)
Result:   Green candle opens below red close (97 < 98) 
          and closes above red open (102 > 100)
          = VALID BULLISH ENGULFING
```

### Bearish Engulfing  
```
Previous: Green candle (open: 100, close: 103)
Current:  Red candle (open: 104, close: 99)
Result:   Red candle opens above green close (104 > 103)
          and closes below green open (99 < 100)  
          = VALID BEARISH ENGULFING
``` 