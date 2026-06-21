import { useState } from "react";
import AddFund from "../common/AddFund";
import FundCard from "../common/FundCard";
import { useSelector, useDispatch } from "react-redux";

import { setActiveDataCount } from "../../store/mf/mfSlice";

const Sips = () => {
    const [activeFund, setActiveFund] = useState({});
    const dispatch = useDispatch();
    const funds = useSelector((state) => state.mf.userData.funds || []);
    const sipFunds = funds.filter((fund) => fund.isSip === true);

    dispatch(setActiveDataCount(sipFunds.length));

    return (
        <section className="sips-section">
            <AddFund fundDetails={activeFund} onClose={() => setActiveFund({})} />
            {sipFunds && sipFunds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sipFunds.map((fund, index) => (
                        <FundCard key={`${fund.isin}-${index}`} fund={fund} onEdit={() => setActiveFund(fund)} />
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">No funds to display.</p>
            )}
        </section>
    );
};

export default Sips;
