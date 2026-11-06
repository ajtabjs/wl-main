window.Core = {};

window.Core.make = function () {

    /// Code inspired by fishes, aka copy-pasted
    window.uiImage = function (src) {
        let img = new Image();
        img.src = src;
        img.classList.add('DqMRee');
        img.classList.add('SsAred'); // Hardcoded, need to figure out what this is and how to make it dynamic or something.
        return img;
    };

    //document.body.style.overflow = 'hidden'; // Hide scroll bar

    window.escapeRegex = function (string) {
        return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    window.graphics_selected = 0;

    daily_button = document.querySelector('[jsname="Prvkrf"]');
    window.daily_challenge = false;

    if (daily_button) {
        // Options for the Intersection Observer
        var options = {
            root: null, // Use the viewport as the root
            threshold: 0.5 // Trigger when 50% of the element is visible
        };

        // Callback function to handle intersection changes
        function handleIntersection(entries, observer) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // The element is now visible on classic menu
                    window.daily_challenge = false;
                }
            });
        }

        // Create an Intersection Observer
        var observer = new IntersectionObserver(handleIntersection, options);

        // Start observing the button
        observer.observe(daily_button);

        daily_button.addEventListener("click", function() {
            window.daily_challenge = true;
            window.first_time_call = true;
        });
    }

}

window.Core.alterCode = function (code) {

    if (code.match(/loaded_/) !== null) {
        console.log(code);
        console.log("Google experiment detected, please provide the above text to Yarmiplay by pressing copy ^^^");
        window.loaded_code = true;
      }
      else {
        window.loaded_code = false;
      }

    // Snake recoloring uses getImageData on offscreen canvases; avoid Chrome's readback warning.
    // This causes lag, so we'd rather have the readback warning than the lag.
    /*
    code = code.assertReplaceAll(
        '.getContext("2d")',
        '.getContext("2d",{willReadFrequently:!0})'
    );
    */

    return code;
}
