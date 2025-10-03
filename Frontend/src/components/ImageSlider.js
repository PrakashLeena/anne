import React, { useState, useEffect } from "react";
import img1 from "../assets/img1.jpg";
import img2 from "../assets/img2.jpg";
import img3 from "../assets/img3.jpg";

const images = [img1, img2, img3];

function ImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  

  return (
    <div className="relative w-2/3 h-96 mx-auto overflow-hidden rounded-xl p-4 flex">
      {/* Images stacked */}
      {images.map((img, index) => (
        <img
          key={index}
          src={img}
          alt="slider"
          className={`p-4 absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            currentIndex === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              currentIndex === index ? "bg-white" : "bg-gray-400"
            }`}
          />
        ))}
      </div>
      
    </div>
  );
}

export default ImageSlider;
