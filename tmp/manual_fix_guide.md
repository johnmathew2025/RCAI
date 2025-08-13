# Fix Duplicate Equipment Code

## The Problem
Your CSV has duplicate equipment code `PMP-CEN-006` on two different entries:
- Line 8: "Misalignment" (general pump misalignment)
- Line 100: "Shaft Misalignment" (specific shaft misalignment)

## The Solution
Change the equipment code for "Shaft Misalignment" from:
```
PMP-CEN-006,F-006
```
to:
```
PMP-CEN-099,F-099
```

## What to Change
Find this line in your file:
```
Rotating,Pumps,Centrifugal,Shaft Misalignment,PMP-CEN-006,F-006,High,...
```

Change it to:
```
Rotating,Pumps,Centrifugal,Shaft Misalignment,PMP-CEN-099,F-099,High,...
```

Once fixed, save as CSV and upload again. The system will then import all 101 entries successfully with proper data integrity.