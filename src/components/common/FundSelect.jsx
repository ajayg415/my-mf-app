import AsyncSelect from 'react-select/async';
import { searchFunds } from '../../utils/api'; // The API function we wrote earlier

const FundSelect = ({ onSelect }) => {

  // This function is called automatically when user types
  const loadOptions = (inputValue, callback) => {
    // 1. If input is too short, don't hit API
    if (inputValue.length < 3) {
      callback([]); 
      return;
    }

    // 2. Call your Firebase Search
    searchFunds(inputValue).then(results => {
      // 3. Transform Firebase data to React-Select format { value, label }
      const options = results.map(fund => ({
        value: fund.id,
        label: fund.name,
        fundData: fund // Keep the whole object if needed later
      }));
      callback(options);
    });
  };

  // Custom Styles to match DaisyUI / Tailwind
  const customStyles = {
    control: (base) => ({
      ...base,
      borderRadius: '0.5rem', // rounded-lg
      padding: '4px',
      borderColor: '#d1d5db', // gray-300
      boxShadow: 'none',
      '&:hover': { borderColor: '#3b82f6' } // blue-500
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? '#eff6ff' : 'white', // blue-50
      color: 'black',
      cursor: 'pointer'
    })
  };

  return (
    <div className="w-full">
      <label className="label">
        <span className="label-text font-bold">Select Mutual Fund</span>
      </label>
      
      <AsyncSelect
        cacheOptions // Remembers previous searches to save API calls
        loadOptions={loadOptions}
        defaultOptions={false} // Don't load anything until they type
        onChange={(selectedOption) => onSelect(selectedOption.fundData)}
        placeholder="Type to search (e.g. Parag Parikh)..."
        styles={customStyles}
        noOptionsMessage={({ inputValue }) => 
          inputValue.length < 3 ? "Type 3+ characters..." : "No funds found"
        }
      />
    </div>
  );
};

export default FundSelect;