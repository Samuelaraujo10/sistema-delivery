import React from 'react';
import { Check, Circle } from 'lucide-react';
import './ProductModifierGroup.css';

const ProductModifierGroup = ({ group, selections, onToggle }) => {
  const currentCount = selections.length;
  const isAtMax = group.max > 0 && currentCount >= group.max;
  const isRequired = group.min > 0;

  return (
    <div className="modifier-group">
      <div className="modifier-group-header">
        <div className="modifier-group-title">
          <h4>{group.name}</h4>
          {isRequired && <span className="badge-required">Obrigatório</span>}
        </div>
        <p className="modifier-group-desc">
          {group.min === 1 && group.max === 1 
            ? 'Escolha 1 opção' 
            : `Escolha entre ${group.min} e ${group.max} opções`}
        </p>
      </div>

      <div className="modifier-options">
        {group.options.map((option, idx) => {
          const isSelected = selections.some(s => s.name === option.name);
          const isDisabled = !isSelected && isAtMax;

          return (
            <label 
              key={idx} 
              className={`modifier-option ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
            >
              <input
                type={group.max === 1 ? 'radio' : 'checkbox'}
                name={group.name}
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => onToggle(group, option)}
                style={{ display: 'none' }}
              />
              <div className="option-info">
                <span className="option-name">{option.name}</span>
                {option.price > 0 && (
                  <span className="option-price">
                    + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(option.price)}
                  </span>
                )}
              </div>
              <div className="option-check">
                {isSelected ? <Check size={18} /> : <div className="circle-placeholder" />}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default ProductModifierGroup;
