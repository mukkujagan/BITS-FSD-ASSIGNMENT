import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

const PageNotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-red-100 rounded-full p-3">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h1 className="mt-4 text-5xl font-extrabold text-gray-900 tracking-tight">404</h1>
          <p className="mt-2 text-2xl font-semibold text-gray-900">Page not found</p>
          <p className="mt-2 text-base text-gray-500">
            Sorry, we couldn't find the page you're looking for.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="btn btn-primary inline-flex items-center"
            >
              <Home className="h-4 w-4 mr-2" />
              Go back home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;