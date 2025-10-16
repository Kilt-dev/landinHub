import React from 'react';
import styled from 'styled-components';

const AddSectionButton = ({
                              guideLinePosition,
                              setShowPopup,
                              onShowAddSectionPopup,
                          }) => {
    return (
        <StyledWrapper
            style={{
                position: 'absolute',
                top: guideLinePosition - 8,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1002,
            }}
        >
            <button
                type="button"
                className="button"
                onClick={(e) => {
                    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                    setShowPopup(true);
                    if (typeof onShowAddSectionPopup === 'function') {
                        onShowAddSectionPopup();
                    }
                }}
            >
                <span className="button__text">Thêm Section</span>
                <span className="button__icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
               stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
               className="lucide lucide-copy-plus-icon lucide-copy-plus"><line x1="15" x2="15" y1="12" y2="18"/><line
              x1="12" x2="18" y1="15" y2="15"/><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path
              d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        </span>
            </button>
        </StyledWrapper>
    );
};

const StyledWrapper = styled.div`
    .button {
        position: relative;
        width: 190px;
        height: 44px;
        cursor: pointer;
        display: flex;
        align-items: center;
        border: 1px solid #34974d;
        background-color: #3aa856;
        border-radius: 8px;
        overflow: hidden;
        bottom: 20px;
    }

    .button,
    .button__icon,
    .button__text {
        transition: all 0.3s;
    }

    .button .button__text {
    transform: translateX(30px);
    color: #fff;
    font-weight: 600;
  }

  .button .button__icon {
    position: absolute;
    transform: translateX(115px);
    height: 100%;
    width: 45px;
      left: 30px;
    background-color: #34974d;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .button .svg {
    width: 26px;
    stroke: #fff;
  }

  .button:hover {
    background: #34974d;
      align-items: center;
      justify-content: center;
     
  }

  .button:hover .button__text {
    color: transparent;
  }

  .button:hover .button__icon {
    width: 160px;
    transform: translateX(0);
  }

  .button:active .button__icon {
    background-color: #2e8644;
  }

  .button:active {
    border: 1px solid #2e8644;
  }
`;

export default AddSectionButton;
