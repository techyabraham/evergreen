# Vehicle catalog

The admin vehicle form provides live suggestions from the NHTSA vPIC API for passenger cars, SUVs/crossovers, trucks/pickups, buses, vans/MPVs, motorcycles/scooters, and tricycles. It asks vPIC for makes after two characters and then gets models for the selected make; when a year from 1996 onward is entered, it uses the year-specific model endpoint. Suggestions are cached by Next.js for one day. If the service is unavailable or a make is outside the catalog, the admin can enter the make and model directly.

vPIC’s own documentation says its dataset is populated from manufacturer submissions and describes model-year lookups as supported for years greater than 1995. It is a reference source for that dataset, not a complete worldwide catalogue and not evidence that a vehicle is currently available in Nigeria. Source: [NHTSA vPIC API documentation](https://vpic.nhtsa.dot.gov/api/Home/Index).

Innoson suggestions are maintained locally from the manufacturer’s published product-line page and model pages so local coverage does not depend on vPIC catalog matching. The suggestions include passenger models, buses, pickups and the manufacturer’s named special-purpose vehicle categories. They are model-name suggestions only; no years, prices, features, or vehicle listings are inferred. Sources: [Innoson product lines](https://www.innosonvehicles.com/celebrating-13-years-of-relentless-pursuit-of-perfection/), [Innoson G20](https://www.innosonvehicles.com/g20/), [Innoson G6](https://www.innosonvehicles.com/g6/).

The selected vehicle class is stored on the listing, and catalog names remain editable. Catalog suggestions do not create public inventory listings; only administrator-entered listings appear on the public site.
