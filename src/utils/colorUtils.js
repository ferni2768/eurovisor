export const getFilterColors = (selectedYear, selectedCountry) => {
    // Default colors (winners)
    let topColor = "rgba(254, 243, 199, 0.45)";
    let middleColor = "rgba(254, 243, 199, 0.15)";
    let bottomColor = "rgba(254, 243, 199, 0)";
    let baseColor = "254, 243, 199"; // Amber color in RGB

    if (selectedYear && selectedCountry) {
        // Year and country selected
        topColor = "rgba(224, 231, 255, 0.45)";
        middleColor = "rgba(224, 231, 255, 0.15)";
        bottomColor = "rgba(224, 231, 255, 0)";
        baseColor = "224, 231, 255"; // Indigo color in RGB
    } else if (selectedYear) {
        // Only year selected
        topColor = "rgba(219, 234, 254, 0.45)";
        middleColor = "rgba(219, 234, 254, 0.15)";
        bottomColor = "rgba(219, 234, 254, 0)";
        baseColor = "219, 234, 254"; // Blue color in RGB
    } else if (selectedCountry) {
        // Only country selected
        topColor = "rgba(209, 250, 229, 0.45)";
        middleColor = "rgba(209, 250, 229, 0.15)";
        bottomColor = "rgba(209, 250, 229, 0)";
        baseColor = "209, 250, 229"; // Green color in RGB
    }

    return {
        topColor,
        middleColor,
        bottomColor,
        baseColor,
        transitionDuration: "300ms"
    };
};