import React, { useEffect, useState } from "react";
import axios from "axios";
import { useCart } from "../utils/CartContext"; // Import useCart hook
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth0 } from "@auth0/auth0-react"; // Import useAuth0 for user authentication
import { useI18nProContext } from "@marchintosh94/i18n-pro-react";

// Helper function to generate random integers
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const BookList = ({ searchQuery }) => {
  const [books, setBooks] = useState([]); // Initialize books as an empty array
  const [loading, setLoading] = useState(true);
  const { addToCart, cartItems } = useCart(); // Access addToCart function and cartItems from CartContext
  const { isAuthenticated } = useAuth0(); // Access isAuthenticated from Auth0
  const [selectedResults, setSelectedResults] = useState(10); //Reduced Results to optimize API Key Usage
  const isTrue = true;
  const { t } = useI18nProContext();

  useEffect(() => {
    // Replace 'YOUR_API_KEY' with your actual Google Books API key
    const apiKey = import.meta.env.VITE_REACT_APP_GOOGLE_API_KEY;
    const query = searchQuery ? `intitle:${searchQuery}` : "programming"; // Filter by title if searchQuery is provided, else use a default query

    axios
      .get(
        `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${apiKey}&maxResults=${selectedResults}`
      )
      .then((response) => {
        if (response.data.items) {
          const booksData = response.data.items.map((book) => {
            // Determine availability information (more available than unavailable)
            const isAvailable = Math.random() < 0.7; // 70% chance of being available
            const availableCopies = isAvailable ? getRandomInt(15, 35) : 0;

            return {
              id: book.id,
              title: book.volumeInfo.title,
              author: book.volumeInfo.authors
                ? book.volumeInfo.authors.join(", ")
                : t("unknown"),
              subject: book.volumeInfo.categories
                ? book.volumeInfo.categories.join(", ")
                : t("unknown"),
              published: book.volumeInfo.publishedDate || t("unknown"),
              isAvailable, // Store availability status
              availableCopies, // Store available copies
              image: book.volumeInfo.imageLinks?.thumbnail || "", // Image URL
            };
          });
          setBooks(booksData);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching book data:", error);
        setLoading(false);
      });
  }, [searchQuery, selectedResults]);

  // Function to add a book to the cart and decrease available copies
  const handleAddToCart = (bookId) => {
    if (!isTrue) {
      // Check if the user is not logged in
      toast.error(t('error_login_to_add_to_cart'), {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 3000,
        hideProgressBar: true,
        closeButton: false,
      });
      return;
    }

    const updatedBooks = books.map((book) => {
      if (book.id === bookId && book.isAvailable) {
        addToCart(book); // Add the book to the cart
        const updatedCopies = book.availableCopies - 1;
        const updatedBook = {
          ...book,
          addedToCart: true,
          availableCopies: updatedCopies,
        };
        const message = t('book_added_to_cart', { title: updatedBook.title });
        toast.success(message, {
          position: toast.POSITION.TOP_CENTER, // Set the toast position
          autoClose: 3000, // Close the toast after 3 seconds (adjust as needed)
          hideProgressBar: true, // Hide the progress bar
          closeButton: false, // Do not show a close button
        });
        return updatedBook;
      }
      return book;
    });
    setBooks(updatedBooks);
  };

  const handleResultsChange = (event) => {
    setSelectedResults(event.target.value);
  };

  return (
    <div className="container mx-auto p-4 py-12 m-auto">
      <h1 className="text-3xl lg:text-4xl font-bold text-[#222222] mb-4">
        {t('book_list_title')}
      </h1>
      <p className="text-lg text-gray-600 mb-4">
        {t('book_list_content')}
      </p>

      <div className="mb-4">
        <label className="text-gray-600 font-semibold">
          {t('results_per_page')}
        </label>
        <select
          className="ml-2 border rounded-lg px-2 py-1 pr-4 focus:outline-none focus:border-blue-500 shadow-sm text-gray-800"
          value={selectedResults}
          onChange={handleResultsChange}
        >
          <option value={5}>5 {t('results')}</option>
          <option value={10}>10 {t('results')}</option>
          <option value={20}>20 {t('results')}</option>
          <option value={30}>30 {t('results')}</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-600">{t('loading')}</p>
      ) : (
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {books.map((book) => (
            <div
              key={book.id}
              className="page-turn bg-[#ead9c6] border rounded-lg shadow-md p-4"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {book.title}
              </h2>
              {book.isAvailable ? (
                <p className="text-green-600 font-semibold mb-2">
                  {t('available')} -{" "}
                  <span className="font-semibold">
                    {book.availableCopies}{" "}
                    {t("copy", book.availableCopies === 1 ? 1:2)}
                  </span>
                </p>
              ) : (
                <p className="text-red-600 font-semibold mb-2">{t('not_available')}</p>
              )}
              <img
                src={book.image}
                alt={book.title}
                className="w-full h-auto mb-2"
              />
              <div className="text-sm text-gray-600">
                <p className="mb-1">{t('author')}: {book.author || t("unknown")}</p>
                <p className="mb-1">{t('genre')}: {book.subject || t("unknown")}</p>
                <p className="mb-1">{t('published')}: {book.published || t("unknown")}</p>
              </div>
              <div className="flex justify-end">
                {book.addedToCart ? (
                  <button
                    className="bg-green-500 text-white font-semibold py-2 px-4 rounded-full cursor-not-allowed"
                    disabled
                  >
                    {t('added_to_cart')}
                  </button>
                ) : (
                  <button
                    onClick={() => handleAddToCart(book.id)}
                    className={`mt-2 ${
                      book.isAvailable
                        ? "bg-[#46331f] hover:bg-[#bd8345]"
                        : "bg-gray-300 cursor-not-allowed"
                    } text-white font-semibold py-2 px-4 rounded-full transition duration-300 ease-in-out`}
                    disabled={!book.isAvailable}
                  >
                    {t('add_to_cart')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookList;
