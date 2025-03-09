import React from 'react';
import PropTypes from 'prop-types';

const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pageNumbers = [];
    
    if (totalPages <= 3) {
      // Show all pages if total pages is 3 or less
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show current page
      if (currentPage === 1) {
        pageNumbers.push(1, 2, '...', totalPages);
      } else if (currentPage === totalPages) {
        pageNumbers.push(1, '...', totalPages - 1, totalPages);
      } else if (currentPage === 2) {
        pageNumbers.push(1, 2, 3, '...', totalPages);
      } else if (currentPage === totalPages - 1) {
        pageNumbers.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pageNumbers.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pageNumbers;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="student-mgmt-pagination">
      <div className="student-mgmt-pagination-nav-container">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="student-mgmt-pagination-nav"
        >
          ‹
        </button>

        {getPageNumbers().map((pageNum, index) => (
          <React.Fragment key={index}>
            {pageNum === '...' ? (
              <span className="student-mgmt-pagination-dots">•••</span>
            ) : (
              <button
                className={currentPage === pageNum ? 'active' : ''}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </button>
            )}
          </React.Fragment>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="student-mgmt-pagination-nav"
        >
          ›
        </button>
      </div>
      
      {/* Removing the pagination info text */}
    </div>
  );
};

Pagination.propTypes = {
  totalItems: PropTypes.number.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default Pagination;
