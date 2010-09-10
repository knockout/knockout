// Some of the Knockout examples use this data
var sampleProductCategories = [
  {
    "products": [
      {
        "name": "1948 Porsche 356-A Roadster",
        "price": 53.9
      },
      {
        "name": "1948 Porsche Type 356 Roadster",
        "price": 62.16
      },
      {
        "name": "1949 Jaguar XK 120",
        "price": 47.25
      },
      {
        "name": "1952 Alpine Renault 1300",
        "price": 98.58
      },
      {
        "name": "1952 Citroen-15CV",
        "price": 72.82
      },
      {
        "name": "1956 Porsche 356A Coupe",
        "price": 98.3
      },
      {
        "name": "1957 Corvette Convertible",
        "price": 69.93
      },
      {
        "name": "1957 Ford Thunderbird",
        "price": 34.21
      },
      {
        "name": "1958 Chevy Corvette Limited Edition",
        "price": 15.91
      },
      {
        "name": "1961 Chevrolet Impala",
        "price": 32.33
      },
      {
        "name": "1962 LanciaA Delta 16V",
        "price": 103.42
      },
      {
        "name": "1965 Aston Martin DB5",
        "price": 65.96
      },
      {
        "name": "1966 Shelby Cobra 427 S/C",
        "price": 29.18
      },
      {
        "name": "1968 Dodge Charger",
        "price": 75.16
      },
      {
        "name": "1968 Ford Mustang",
        "price": 95.34
      },
      {
        "name": "1969 Chevrolet Camaro Z28",
        "price": 50.51
      },
      {
        "name": "1969 Corvair Monza",
        "price": 89.14
      },
      {
        "name": "1969 Dodge Charger",
        "price": 58.73
      },
      {
        "name": "1969 Dodge Super Bee",
        "price": 49.05
      },
      {
        "name": "1969 Ford Falcon",
        "price": 83.05
      },
      {
        "name": "1970 Chevy Chevelle SS 454",
        "price": 49.24
      },
      {
        "name": "1970 Dodge Coronet",
        "price": 32.37
      },
      {
        "name": "1970 Plymouth Hemi Cuda",
        "price": 31.92
      },
      {
        "name": "1970 Triumph Spitfire",
        "price": 91.92
      },
      {
        "name": "1971 Alpine Renault 1600s",
        "price": 38.58
      },
      {
        "name": "1972 Alfa Romeo GTA",
        "price": 85.68
      },
      {
        "name": "1976 Ford Gran Torino",
        "price": 73.49
      },
      {
        "name": "1982 Camaro Z28",
        "price": 46.53
      },
      {
        "name": "1982 Lamborghini Diablo",
        "price": 16.24
      },
      {
        "name": "1985 Toyota Supra",
        "price": 57.01
      },
      {
        "name": "1992 Ferrari 360 Spider red",
        "price": 77.9
      },
      {
        "name": "1992 Porsche Cayenne Turbo Silver",
        "price": 69.78
      },
      {
        "name": "1993 Mazda RX-7",
        "price": 83.51
      },
      {
        "name": "1995 Honda Civic",
        "price": 93.89
      },
      {
        "name": "1998 Chrysler Plymouth Prowler",
        "price": 101.51
      },
      {
        "name": "1999 Indy 500 Monte Carlo SS",
        "price": 56.76
      },
      {
        "name": "2001 Ferrari Enzo",
        "price": 95.59
      },
      {
        "name": "2002 Chevy Corvette",
        "price": 62.11
      }
    ],
    "name": "Classic Cars"
  },
  {
    "products": [
      {
        "name": "1936 Harley Davidson El Knucklehead",
        "price": 24.23
      },
      {
        "name": "1957 Vespa GS150",
        "price": 32.95
      },
      {
        "name": "1960 BSA Gold Star DBD34",
        "price": 37.32
      },
      {
        "name": "1969 Harley Davidson Ultimate Chopper",
        "price": 48.81
      },
      {
        "name": "1974 Ducati 350 Mk3 Desmo",
        "price": 56.13
      },
      {
        "name": "1982 Ducati 900 Monster",
        "price": 47.1
      },
      {
        "name": "1982 Ducati 996 R",
        "price": 24.14
      },
      {
        "name": "1996 Moto Guzzi 1100i",
        "price": 68.99
      },
      {
        "name": "1997 BMW F650 ST",
        "price": 66.92
      },
      {
        "name": "1997 BMW R 1100 S",
        "price": 60.86
      },
      {
        "name": "2002 Suzuki XREO",
        "price": 66.27
      },
      {
        "name": "2002 Yamaha YZR M1",
        "price": 34.17
      },
      {
        "name": "2003 Harley-Davidson Eagle Drag Bike",
        "price": 91.02
      }
    ],
    "name": "Motorcycles"
  },
  {
    "products": [
      {
        "name": "1900s Vintage Bi-Plane",
        "price": 34.25
      },
      {
        "name": "1900s Vintage Tri-Plane",
        "price": 36.23
      },
      {
        "name": "1928 British Royal Navy Airplane",
        "price": 66.74
      },
      {
        "name": "1980s Black Hawk Helicopter",
        "price": 77.27
      },
      {
        "name": "ATA: B757-300",
        "price": 59.33
      },
      {
        "name": "America West Airlines B757-200",
        "price": 68.8
      },
      {
        "name": "American Airlines: B767-300",
        "price": 51.15
      },
      {
        "name": "American Airlines: MD-11S",
        "price": 36.27
      },
      {
        "name": "Boeing X-32A JSF",
        "price": 32.77
      },
      {
        "name": "Corsair F4U ( Bird Cage)",
        "price": 29.34
      },
      {
        "name": "F/A 18 Hornet 1/72",
        "price": 54.4
      },
      {
        "name": "P-51-D Mustang",
        "price": 49.0
      }
    ],
    "name": "Planes"
  },
  {
    "products": [
      {
        "name": "18th century schooner",
        "price": 82.34
      },
      {
        "name": "1999 Yamaha Speed Boat",
        "price": 51.61
      },
      {
        "name": "HMS Bounty",
        "price": 39.83
      },
      {
        "name": "Pont Yacht",
        "price": 33.3
      },
      {
        "name": "The Mayflower",
        "price": 43.3
      },
      {
        "name": "The Queen Mary",
        "price": 53.63
      },
      {
        "name": "The Schooner Bluenose",
        "price": 34.0
      },
      {
        "name": "The Titanic",
        "price": 51.09
      },
      {
        "name": "The USS Constitution Ship",
        "price": 33.97
      }
    ],
    "name": "Ships"
  },
  {
    "products": [
      {
        "name": "1950's Chicago Surface Lines Streetcar",
        "price": 26.72
      },
      {
        "name": "1962 City of Detroit Streetcar",
        "price": 37.49
      },
      {
        "name": "Collectable Wooden Train",
        "price": 67.56
      }
    ],
    "name": "Trains"
  },
  {
    "products": [
      {
        "name": "1926 Ford Fire Engine",
        "price": 24.92
      },
      {
        "name": "1940 Ford Pickup Truck",
        "price": 58.33
      },
      {
        "name": "1940s Ford truck",
        "price": 84.76
      },
      {
        "name": "1954 Greyhound Scenicruiser",
        "price": 25.98
      },
      {
        "name": "1957 Chevy Pickup",
        "price": 55.7
      },
      {
        "name": "1958 Setra Bus",
        "price": 77.9
      },
      {
        "name": "1962 Volkswagen Microbus",
        "price": 61.34
      },
      {
        "name": "1964 Mercedes Tour Bus",
        "price": 74.86
      },
      {
        "name": "1980’s GM Manhattan Express",
        "price": 53.93
      },
      {
        "name": "1996 Peterbilt 379 Stake Bed with Outrigger",
        "price": 33.61
      },
      {
        "name": "Diamond T620 Semi-Skirted Tanker",
        "price": 68.29
      }
    ],
    "name": "Trucks and Buses"
  },
  {
    "products": [
      {
        "name": "18th Century Vintage Horse Carriage",
        "price": 60.74
      },
      {
        "name": "1903 Ford Model A",
        "price": 68.3
      },
      {
        "name": "1904 Buick Runabout",
        "price": 52.66
      },
      {
        "name": "1911 Ford Town Car",
        "price": 33.3
      },
      {
        "name": "1912 Ford Model T Delivery Wagon",
        "price": 46.91
      },
      {
        "name": "1913 Ford Model T Speedster",
        "price": 60.78
      },
      {
        "name": "1917 Grand Touring Sedan",
        "price": 86.7
      },
      {
        "name": "1917 Maxwell Touring Car",
        "price": 57.54
      },
      {
        "name": "1928 Ford Phaeton Deluxe",
        "price": 33.02
      },
      {
        "name": "1928 Mercedes-Benz SSK",
        "price": 72.56
      },
      {
        "name": "1930 Buick Marquette Phaeton",
        "price": 27.06
      },
      {
        "name": "1932 Alfa Romeo 8C2300 Spider Sport",
        "price": 43.26
      },
      {
        "name": "1932 Model A Ford J-Coupe",
        "price": 58.48
      },
      {
        "name": "1934 Ford V8 Coupe",
        "price": 34.35
      },
      {
        "name": "1936 Chrysler Airflow",
        "price": 57.46
      },
      {
        "name": "1936 Mercedes Benz 500k Roadster",
        "price": 21.75
      },
      {
        "name": "1936 Mercedes-Benz 500K Special Roadster",
        "price": 24.26
      },
      {
        "name": "1937 Horch 930V Limousine",
        "price": 26.3
      },
      {
        "name": "1937 Lincoln Berline",
        "price": 60.62
      },
      {
        "name": "1938 Cadillac V-16 Presidential Limousine",
        "price": 20.61
      },
      {
        "name": "1939 Cadillac Limousine",
        "price": 23.14
      },
      {
        "name": "1939 Chevrolet Deluxe Coupe",
        "price": 22.57
      },
      {
        "name": "1940 Ford Delivery Sedan",
        "price": 48.64
      },
      {
        "name": "1941 Chevrolet Special Deluxe Cabriolet",
        "price": 64.58
      }
    ],
    "name": "Vintage Cars"
  }
];