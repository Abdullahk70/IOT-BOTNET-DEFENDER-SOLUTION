import React from "react";
import { FiActivity, FiShield, FiCpu, FiBarChart2 } from "react-icons/fi";

const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        About NetGuardian
      </h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-indigo-600 mb-4">
          Project Overview
        </h2>
        <p className="text-gray-700 mb-4">
          NetGuardian is an advanced network security tool designed to protect
          IoT networks from botnet attacks. By combining traditional IoT botnet
          detection with powerful data preprocessing capabilities, NetGuardian
          offers a comprehensive solution for network administrators and
          security professionals.
        </p>
        <p className="text-gray-700 mb-4">
          The application merges the original IoT-Botnet-Defender project with
          new feature preprocessing capabilities, creating a powerful tool for
          both analysis and preparation of network security data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="bg-indigo-100 p-3 rounded-lg mr-4">
              <FiShield className="text-indigo-600 w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold">IoT Botnet Detection</h3>
          </div>
          <p className="text-gray-700">
            Analyze network traffic to identify potential botnet activities in
            IoT devices. Our advanced detection algorithms can identify
            anomalies and potential threats in your network with high accuracy.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="bg-indigo-100 p-3 rounded-lg mr-4">
              <FiCpu className="text-indigo-600 w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold">Data Preprocessing</h3>
          </div>
          <p className="text-gray-700">
            Prepare and optimize your network data for analysis with our
            comprehensive preprocessing tools. From normalization to feature
            scaling, NetGuardian provides all the tools you need for effective
            data preparation.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-indigo-600 mb-4">
          Technology Stack
        </h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>
            <span className="font-medium">Frontend:</span> React with
            TypeScript, Tailwind CSS
          </li>
          <li>
            <span className="font-medium">Backend:</span> Express.js, Node.js
          </li>
          <li>
            <span className="font-medium">Data Processing:</span> Python with
            scikit-learn, pandas
          </li>
          <li>
            <span className="font-medium">Database:</span> MongoDB
          </li>
          <li>
            <span className="font-medium">Visualization:</span> Plotly, Chart.js
          </li>
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-indigo-600 mb-4">
          Project Team
        </h2>
        <p className="text-gray-700 mb-4">
          NetGuardian is developed by a dedicated team of cybersecurity experts
          and data scientists committed to creating effective tools for network
          protection.
        </p>
        <div className="flex justify-center mt-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <FiActivity className="w-12 h-12 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Contact Us
            </h3>
            <p className="text-gray-600">
              Have questions or suggestions? Reach out to our team!
            </p>
            <p className="text-indigo-600 mt-2">
              support@netguardian.example.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
