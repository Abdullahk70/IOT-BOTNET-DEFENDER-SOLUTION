import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";

const CsvDisplay: React.FC = () => {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchColumn, setSearchColumn] = useState<string>("all");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Fetch CSV data
  useEffect(() => {
    const fetchCsvData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // In a real app, this would call your backend API
        // For now, we'll generate mock data
        const mockData = generateMockData(100, 5);
        const mockHeaders = Object.keys(mockData[0]);

        setCsvData(mockData);
        setHeaders(mockHeaders);
        setTotalPages(Math.ceil(mockData.length / pageSize));
      } catch (err) {
        console.error("Error fetching CSV data:", err);
        setError(
          "Failed to fetch CSV data. Please check if a dataset has been uploaded."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCsvData();
  }, [pageSize]);

  // Generate mock data for demonstration
  const generateMockData = (rows: number, columns: number) => {
    const data = [];
    const columnTypes = ["number", "string", "boolean", "date", "category"];

    for (let i = 0; i < rows; i++) {
      const row: Record<string, any> = { id: i + 1 };

      for (let j = 0; j < columns; j++) {
        const columnType = columnTypes[j % columnTypes.length];
        const columnName = `column_${j + 1}`;

        switch (columnType) {
          case "number":
            row[columnName] = parseFloat((Math.random() * 100).toFixed(2));
            break;
          case "string":
            row[columnName] = `Value ${i}-${j}`;
            break;
          case "boolean":
            row[columnName] = Math.random() > 0.5;
            break;
          case "date":
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 365));
            row[columnName] = date.toISOString().split("T")[0];
            break;
          case "category":
            const categories = ["Low", "Medium", "High", "Critical"];
            row[columnName] =
              categories[Math.floor(Math.random() * categories.length)];
            break;
        }
      }

      data.push(row);
    }

    return data;
  };

  // Filter data based on search term
  const filteredData = csvData.filter((row) => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();

    if (searchColumn === "all") {
      return Object.values(row).some((value) =>
        String(value).toLowerCase().includes(term)
      );
    } else {
      return String(row[searchColumn]).toLowerCase().includes(term);
    }
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;

    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    const aString = String(aValue).toLowerCase();
    const bString = String(bValue).toLowerCase();

    if (sortDirection === "asc") {
      return aString.localeCompare(bString);
    } else {
      return bString.localeCompare(aString);
    }
  });

  // Pagination
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page
    setTotalPages(Math.ceil(filteredData.length / newSize));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const handleSearchColumnChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSearchColumn(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  return (
    <motion.div
      className="fyp-component"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="component-header">
        <h2 className="component-title">Dataset Viewer</h2>
        <p className="component-description">
          View and explore your dataset to better understand your data.
        </p>
      </div>

      <div className="component-content">
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading dataset...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="csv-display">
            <div className="csv-controls">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="search-input"
                />
                <select
                  value={searchColumn}
                  onChange={handleSearchColumnChange}
                  className="search-column-select"
                >
                  <option value="all">All Columns</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pagination-controls">
                <div className="page-size-container">
                  <label htmlFor="page-size">Rows per page:</label>
                  <select
                    id="page-size"
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className="page-size-select"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>

                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="pagination-button"
                  >
                    {"<<"}
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-button"
                  >
                    {"<"}
                  </button>
                  <span className="page-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-button"
                  >
                    {">"}
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="pagination-button"
                  >
                    {">>"}
                  </button>
                </div>
              </div>
            </div>

            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {headers.map((header) => (
                      <th
                        key={header}
                        onClick={() => handleSort(header)}
                        className={`sortable-header ${
                          sortColumn === header ? "sorted" : ""
                        }`}
                      >
                        {header}
                        {sortColumn === header && (
                          <span className="sort-indicator">
                            {sortDirection === "asc" ? " ▲" : " ▼"}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {headers.map((header) => (
                          <td key={`${rowIndex}-${header}`}>
                            {typeof row[header] === "boolean"
                              ? row[header]
                                ? "True"
                                : "False"
                              : String(row[header])}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={headers.length} className="no-data">
                        No data found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="data-summary">
              <div className="summary-item">
                <span className="summary-label">Total Rows:</span>
                <span className="summary-value">{csvData.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Filtered Rows:</span>
                <span className="summary-value">{filteredData.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Columns:</span>
                <span className="summary-value">{headers.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CsvDisplay;
