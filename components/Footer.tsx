import React from 'react';
import { Linkedin, Instagram, Github } from 'lucide-react';

const App = () => {
  return (
    <footer className="bg-gray-950 text-gray-50 py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-800 rounded-none shadow-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
        {/* Logo Section */}
        <div className="flex items-center space-x-2">
          <img src="/boid-logo.ico" alt="ThreeBoid Logo" width={32} height={32} />
          <span className="text-xl font-semibold">ThreeBoid</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
          <a href="#" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 font-medium">
            Documentation
          </a>
          <a href="#" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 font-medium">
            Source Code
          </a>
          <a href="#" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 font-medium">
            Reference Doc
          </a>
        </nav>

        {/* Social Icons */}
        <div className="flex space-x-4">
          <a href="#" className="text-gray-300 hover:text-blue-400 transition-colors duration-300">
            <Linkedin size={20} />
          </a>
          <a href="https://instagram.com/katakuri.2004" className="text-gray-300 hover:text-blue-400 transition-colors duration-300">
            <Instagram size={20} />
          </a>
          <a href="https://github.com/Katakuri004" className="text-gray-300 hover:text-blue-400 transition-colors duration-300">
            <Github size={20} />
          </a>
        </div>
      </div>


      <hr className="border-gray-800 my-8 max-w-7xl mx-auto" />


      <div className="text-center text-gray-600 text-sm">
        &copy; Copyright 2022, All Rights Reserved by ThreeBoids by Kata
      </div>
    </footer>
  );
};

export default App;