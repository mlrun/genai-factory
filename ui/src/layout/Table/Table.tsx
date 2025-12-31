import { Outlet } from 'react-router-dom';

const Table = () => {
  return (
    <div className="py-8 px-14">
      <Outlet />
    </div>
  );
};

export default Table;
