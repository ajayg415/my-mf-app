import FundCard from "../common/FundCard";
import { useSelector, useDispatch } from "react-redux"; 

import { setActiveDataCount } from "../../store/mf/mfSlice";

const Favoutite = () => {
    const { funds } = useSelector((state) => state.mf.userData);
    const favFunds = funds.filter(fund => fund.isFavorite);
    const dispatch = useDispatch();
    dispatch(setActiveDataCount(favFunds.length));
    return (
        <section className="favoutite-section">
            {favFunds && favFunds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {favFunds.map((fund, index) => (
                        <FundCard key={fund.isin + index} fund={fund} />
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 mt-4">No funds to display.</p>
            )}
        </section>
    );
}
export default Favoutite;