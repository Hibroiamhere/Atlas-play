'use server';
/**
 * @fileOverview Provides a local dictionary of continents, countries, states, and cities for fallback.
 */

const continents: string[] = [
  "Asia", "Africa", "North America", "South America", "Antarctica", "Europe", "Australia" // Australia is also a continent
];

// A sample list. In a real application, this would be much larger or fetched from a more robust source.
const countries: string[] = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cambodia", "Cameroon", "Canada", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Samoa", "San Marino", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];

const statesProvinces: string[] = [
  // USA
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
  // Canada
  "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Quebec", "Saskatchewan",
  // Australia
  "New South Wales", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia",
  // India
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  // Germany
  "Bavaria", "Berlin", "Hesse", "Saxony",
  // Brazil
  "Amazonas", "Bahia", "Rio de Janeiro", "Sao Paulo"
];

const famousCities: string[] = [
  // General Famous Cities
  "Accra", "Addis Ababa", "Amsterdam", "Ankara", "Athens", "Atlanta",
  "Baghdad", "Bangkok", "Barcelona", "Beijing", "Beirut", "Belgrade", "Berlin", "Bogota", "Boston", "Brasilia", "Bratislava", "Brussels", "Bucharest", "Budapest", "Buenos Aires",
  "Cairo", "Cape Town", "Caracas", "Casablanca", "Chicago", "Copenhagen",
  "Dakar", "Dallas", "Damascus", "Dhaka", "Doha", "Dubai", "Dublin",
  "Edinburgh",
  "Frankfurt",
  "Geneva", "Guangzhou",
  "Hanoi", "Havana", "Helsinki", "Ho Chi Minh City", "Hong Kong", "Houston",
  "Islamabad", "Istanbul",
  "Jakarta", "Jerusalem", "Johannesburg",
  "Kabul", "Kampala", "Karachi", "Kathmandu", "Khartoum", "Kiev", "Kingston", "Kinshasa", "Kuala Lumpur", "Kuwait City",
  "Lagos", "Lahore", "Lima", "Lisbon", "Ljubljana", "London", "Los Angeles", "Luanda", "Lusaka", "Luxembourg City", "Lyon",
  "Madrid", "Manila", "Marrakech", "Mecca", "Medina", "Melbourne", "Mexico City", "Miami", "Milan", "Minsk", "Mogadishu", "Monrovia", "Montevideo", "Montreal", "Moscow", "Mumbai", "Munich",
  "Nairobi", "Naples", "New Delhi", "New York City", "Nicosia",
  "Osaka", "Oslo", "Ottawa",
  "Panama City", "Paris", "Perth", "Philadelphia", "Phnom Penh", "Port-au-Prince", "Prague", "Pretoria", "Pyongyang",
  "Quito",
  "Rabat", "Reykjavik", "Riga", "Rio de Janeiro", "Riyadh", "Rome",
  "San Francisco", "San Jose", "San Juan", "San Salvador", "Santiago", "Santo Domingo", "Sao Paulo", "Sapporo", "Sarajevo", "Seattle", "Seoul", "Shanghai", "Singapore", "Sofia", "Stockholm", "Sydney",
  "Taipei", "Tallinn", "Tashkent", "Tbilisi", "Tehran", "Tel Aviv", "Tokyo", "Toronto", "Tripoli", "Tunis",
  "Ulaanbaatar",
  "Vancouver", "Venice", "Vienna", "Vientiane", "Vilnius",
  "Warsaw", "Washington D.C.", "Wellington",
  "Yangon", "Yaounde",
  "Zagreb", "Zurich",
  // Indian Cities
  "Agra", "Ahmedabad", "Allahabad", "Amritsar", "Aurangabad", "Bengaluru", "Bhopal", "Bhubaneswar", "Chandigarh", "Chennai", "Coimbatore", "Dehradun",
  "Delhi", "Faridabad", "Ghaziabad", "Guwahati", "Gwalior", "Hyderabad", "Indore", "Jaipur", "Jamshedpur", "Jodhpur", "Kanpur", "Kochi", "Kolkata",
  "Kota", "Lucknow", "Ludhiana", "Madurai", "Mangalore", "Meerut", "Mysuru", "Nagpur", "Nashik", "Navi Mumbai", "Patna", "Pimpri-Chinchwad",
  "Pune", "Raipur", "Rajkot", "Ranchi", "Shimla", "Srinagar", "Surat", "Thane", "Thiruvananthapuram", "Udaipur", "Vadodara", "Varanasi", "Vijayawada", "Visakhapatnam"
];

const allLocalPlaces = new Set([
    ...continents,
    ...countries,
    ...statesProvinces,
    ...famousCities
].map(place => place.toLowerCase()));

const allLocalPlacesArray = [
    ...continents,
    ...countries,
    ...statesProvinces,
    ...famousCities
];

function normalize(location: string): string {
    return location.trim().toLowerCase();
}

export async function isValidLocalLocation(location: string, currentChain: string[]): Promise<{ isValid: boolean; reason?: string }> {
    const normalizedLocation = normalize(location);
    const normalizedChain = currentChain.map(normalize);

    if (normalizedChain.includes(normalizedLocation)) {
        return { isValid: false, reason: `'${location}' has already been used in the current chain (local check).` };
    }
    if (allLocalPlaces.has(normalizedLocation)) {
        return { isValid: true };
    }
    return { isValid: false, reason: `'${location}' is not a recognized place in the local dictionary.` };
}

export async function getLocalLocationSuggestion(requiredStartLetter: string, currentChain: string[]): Promise<string | null> {
    const normalizedRequiredLetter = requiredStartLetter.toLowerCase();
    const normalizedChain = currentChain.map(normalize);

    const possibleSuggestions = allLocalPlacesArray.filter(place => {
        const normalizedPlace = normalize(place);
        return normalizedPlace.startsWith(normalizedRequiredLetter) && !normalizedChain.includes(normalizedPlace);
    });

    if (possibleSuggestions.length > 0) {
        // Return a random suggestion to make it less predictable
        return possibleSuggestions[Math.floor(Math.random() * possibleSuggestions.length)];
    }
    return null;
}

export async function getLocalLocationHints(currentChain: string[], numberOfHints: number): Promise<string[]> {
    if (currentChain.length === 0) {
        // Suggest random places if chain is empty, starting with 'S' as per game start.
        const startingLetter = 's';
        const filteredPlaces = allLocalPlacesArray.filter(place => normalize(place).startsWith(startingLetter));
        const shuffled = filteredPlaces.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, numberOfHints);
    }

    const lastLocation = currentChain[currentChain.length - 1];
    if (!lastLocation) return [];

    // Determine the required starting letter for the next hint
    const lastLetter = lastLocation.trim().slice(-1).toLowerCase();
    if (!lastLetter.match(/[a-z]/i)) return []; // If last char isn't a letter

    const normalizedChain = currentChain.map(normalize);

    const possibleHints = allLocalPlacesArray.filter(place => {
        const normalizedPlace = normalize(place);
        return normalizedPlace.startsWith(lastLetter) && !normalizedChain.includes(normalizedPlace);
    });

    // Shuffle and take the required number of hints
    const shuffledHints = possibleHints.sort(() => 0.5 - Math.random());
    return shuffledHints.slice(0, numberOfHints);
}

// This is a placeholder and not a robust spellchecker.
// For the current scope, we'll rely on AI for correction. If AI fails, local dictionary won't correct.
export async function correctLocalPlaceName(userInput: string): Promise<string> {
    const normalizedInput = normalize(userInput);
    if (allLocalPlaces.has(normalizedInput)) {
        // Find the original casing
        const originalCasing = allLocalPlacesArray.find(p => normalize(p) === normalizedInput);
        return originalCasing || userInput;
    }
    // Basic correction examples (very limited)
    if (normalizedInput === "pariss") return "Paris";
    if (normalizedInput === "londom") return "London";
    if (normalizedInput === "tokyo") return "Tokyo"; // Already correct, but good for matching
    // Add more simple corrections if needed, but this is not scalable for a full spellchecker.
    return userInput; // Return original if no simple correction found
}
