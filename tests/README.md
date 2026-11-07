# AstrologyPro test fixtures

These fixtures are intended for manual and automated regression checks.

Recommended validation workflow:
1. Open the app with a static server.
2. Create each fixture profile.
3. Confirm planetary positions are finite and responsive to time changes.
4. Compare selected planetary longitudes and angular points against a trusted reference ephemeris before release changes.
5. Confirm Whole Sign and Equal houses remain 30° apart.
6. Confirm selecting Placidus returns a clear unsupported message.
7. Confirm invalid coordinates and IANA timezones are blocked by the form.

For authoritative astronomical regression testing, pin exact expected values against a trusted reference dataset and the same ephemeris version.
