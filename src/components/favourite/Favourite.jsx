import FundCard from "../common/FundCard";
import { useSelector } from "react-redux"; 

const Favoutite = () => {
    const { funds } = useSelector((state) => state.mf.userData);
    const favFUnds = funds.filter(fund => fund.isFavorite);
    return (
        <section className="favoutite-section">
            {favFUnds && favFUnds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {favFUnds.map((fund) => (
                        <FundCard key={fund.code} fund={fund} />
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 mt-4">No funds to display.</p>
            )}
        </section>
    );
}
export default Favoutite;