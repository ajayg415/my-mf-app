import AddFund from "../common/AddFund";
import FundCard from "../common/FundCard";
import { useSelector, useDispatch } from "react-redux"; 

import { setActiveDataCount } from "../../store/mf/mfSlice";

const Holdings = () => {
    const dispatch = useDispatch();
    const { funds } = useSelector((state) => state.mf.userData);
    const filteredFunds = funds.filter(fund => parseFloat(fund.costValue));
    dispatch(setActiveDataCount(filteredFunds.length));
    return (
        <section className="holdings-section">
            <AddFund />
            {filteredFunds && filteredFunds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFunds.map((fund, index) => (
                        <FundCard key={fund.isin + index} fund={fund} />
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">No funds to display.</p>
            )}
        </section>
    );
}
export default Holdings;