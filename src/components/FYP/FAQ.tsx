import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHelpCircle,
  FiPlus,
  FiMinus,
  FiShield,
  FiDatabase,
} from "react-icons/fi";

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqCategories = [
    {
      title: "IoT Botnet Defender",
      icon: <FiShield className="text-red-500" />,
      questions: [
        {
          question: "What is an IoT botnet?",
          answer:
            "An IoT botnet is a network of internet-connected devices (like cameras, routers, or smart home devices) that have been infected with malware and can be controlled remotely by an attacker. These compromised devices can be used for distributed denial-of-service (DDoS) attacks, data theft, or spreading malware.",
        },
        {
          question: "How does NetGuardian detect IoT botnet attacks?",
          answer:
            "NetGuardian uses a combination of machine learning models, including autoencoders and convolutional neural networks (CNNs), to analyze network traffic patterns. It identifies anomalies in the traffic that may indicate botnet activity, such as unusual communication patterns, suspicious data transfers, or known command and control server interactions.",
        },
        {
          question: "What should I do if botnet activity is detected?",
          answer:
            "If botnet activity is detected, you should: 1) Isolate the affected devices from your network, 2) Change all passwords for the compromised devices, 3) Update firmware to the latest version, 4) Reset devices to factory settings if necessary, and 5) Implement additional security measures like network segmentation and regular monitoring.",
        },
        {
          question: "What types of IoT botnet attacks can NetGuardian detect?",
          answer:
            "NetGuardian can detect various types of IoT botnet attacks including Mirai botnet variants, Bashlite, Torii, and other common IoT malware. The system is designed to identify command and control (C&C) communications, unusual scanning activity, and abnormal data exfiltration patterns typical of compromised IoT devices.",
        },
        {
          question: "How accurate is the detection system?",
          answer:
            "NetGuardian's detection system achieves over 95% accuracy with a low false positive rate. The system uses a multi-model approach combining anomaly detection (autoencoder) and classification (CNN) to maximize accuracy. Regular updates to the models help maintain high performance against emerging threats.",
        },
      ],
    },
    {
      title: "Data Preprocessing & Machine Learning",
      icon: <FiDatabase className="text-indigo-500" />,
      questions: [
        {
          question: "What is data preprocessing?",
          answer:
            "Data preprocessing is a crucial step in machine learning that involves transforming raw data into a clean and suitable format for building models. This includes handling missing values, normalization, encoding categorical variables, and feature selection.",
        },
        {
          question: "Why is normalization important?",
          answer:
            "Normalization scales features to a similar range, which prevents features with larger values from dominating the model training process. This leads to faster convergence and more stable model performance, especially for algorithms like gradient descent.",
        },
        {
          question:
            "What's the difference between min-max scaling and standardization?",
          answer:
            "Min-max scaling transforms data to a fixed range (typically 0-1) while preserving the distribution shape. Standardization (z-score) centers the data around mean=0 with standard deviation=1. Min-max is preferred when you need bounded values, while standardization works better when you have outliers.",
        },
        {
          question: "How do I handle categorical data?",
          answer:
            "Categorical data can be encoded using techniques like one-hot encoding (creating binary columns for each category), label encoding (assigning numeric values to categories), or more advanced methods like target encoding based on your specific needs.",
        },
        {
          question: "What is feature selection and why is it important?",
          answer:
            "Feature selection is the process of choosing the most relevant variables for your model. It helps reduce dimensionality, prevent overfitting, improve model performance, and decrease training time. Methods include statistical tests, correlation analysis, and embedded methods.",
        },
        {
          question: "How do I handle imbalanced datasets?",
          answer:
            "Imbalanced datasets can be addressed through techniques like oversampling the minority class (SMOTE), undersampling the majority class, generating synthetic data, using weighted loss functions, or ensemble methods designed for imbalanced data.",
        },
        {
          question: "What is data splitting and what ratios should I use?",
          answer:
            "Data splitting divides your dataset into training, validation, and test sets. Common ratios are 70-15-15 or 80-10-10. The training set is used to train the model, validation for hyperparameter tuning, and the test set for final performance evaluation.",
        },
        {
          question: "How can I detect and handle outliers?",
          answer:
            "Outliers can be detected using statistical methods (z-score, IQR), visualization (box plots, scatter plots), or machine learning techniques (isolation forests, DBSCAN). Once detected, they can be removed, transformed, or treated as a separate category depending on the context.",
        },
      ],
    },
  ];

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <FiHelpCircle className="text-indigo-500" /> Frequently Asked
          Questions
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Common questions about botnet detection and data preprocessing
          workflows.
        </p>
      </div>

      <div className="space-y-8">
        {faqCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="category-section">
            <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-800 dark:text-gray-200">
              {category.icon}
              <span className="ml-2">{category.title}</span>
            </h3>

            <div className="space-y-3">
              {category.questions.map((faq, faqIndex) => {
                const index = categoryIndex * 100 + faqIndex;
                const isOpen = openIndex === index;

                return (
                  <motion.div
                    key={index}
                    className="bg-gray-50 dark:bg-gray-900/30 rounded-lg overflow-hidden"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: faqIndex * 0.05 }}
                  >
                    <button
                      className="w-full text-left px-5 py-4 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded-lg"
                      onClick={() => toggleFaq(index)}
                    >
                      <span className="text-gray-800 dark:text-gray-100 font-medium">
                        {faq.question}
                      </span>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-indigo-500 flex-shrink-0 ml-4"
                      >
                        {isOpen ? <FiMinus /> : <FiPlus />}
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default FAQ;
